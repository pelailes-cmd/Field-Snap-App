import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { useAuth } from './AuthContext';

export interface FieldRecord {
  id: string;
  userId: string;
  imageData: string;
  timestamp: number;
  metadata: {
    projectName: string;
    location: string;
    trade: string;
    details: string;
    engineer: string;
    inspectedBy: string;
    remarks: string;
  };
}

export type TaskStatus = 'Pending' | 'On-going' | 'Completed' | 'Cancelled';

export interface ScheduleEvent {
  id: string;
  userId: string;
  subject: string;
  notes: string;
  details: string;
  dateTime: string;
  status: TaskStatus;
  reminderMinutes?: number;
  notifiedOneHour?: boolean;
}

export interface InspectionForm {
  id: string;
  userId: string;
  type: 'Routing' | 'TechnicalReport';
  projectName: string;
  location: string;
  trade: string;
  date: string;
  issues: string;
  addressedTo: string;
  approvedBy: string;
  requestedBy: string;
  imageIds?: string[];
  status: 'Pending' | 'Approved' | 'Implemented';
  remarks: string;
  timestamp: number;
}

export interface Tenant {
  id: string;
  userId: string;
  name: string;
  type: string;
  status: 'Active' | 'Inactive';
  contactPerson: string;
  timestamp: number;
}

export interface UtilityReading {
  id: string;
  userId: string;
  tenantId: string;
  type: 'Electric' | 'Water' | 'Gas';
  currentReading: number;
  previousReading: number;
  ratePrice: number;
  accountNumber: string;
  timestamp: number;
}

interface FieldSnapDB extends DBSchema {
  records: {
    key: string;
    value: FieldRecord;
    indexes: { 
      'by-date': number;
      'by-user': string;
    };
  };
  schedules: {
    key: string;
    value: ScheduleEvent;
    indexes: {
      'by-user': string;
      'by-date': string;
    };
  };
  forms: {
    key: string;
    value: InspectionForm;
    indexes: {
      'by-user': string;
      'by-date': string;
    };
  };
  tenants: {
    key: string;
    value: Tenant;
    indexes: {
      'by-user': string;
    };
  };
  readings: {
    key: string;
    value: UtilityReading;
    indexes: {
      'by-user': string;
      'by-tenant': string;
    };
  };
}

interface StorageContextType {
  saveRecord: (record: Omit<FieldRecord, 'userId'>) => Promise<void>;
  getRecords: () => Promise<FieldRecord[]>;
  deleteRecord: (id: string) => Promise<void>;
  saveSchedule: (event: Omit<ScheduleEvent, 'userId'>) => Promise<void>;
  getSchedules: () => Promise<ScheduleEvent[]>;
  deleteSchedule: (id: string) => Promise<void>;
  saveForm: (form: Omit<InspectionForm, 'userId'>) => Promise<void>;
  getForms: () => Promise<InspectionForm[]>;
  deleteForm: (id: string) => Promise<void>;
  saveTenant: (tenant: Omit<Tenant, 'userId'>) => Promise<void>;
  getTenants: () => Promise<Tenant[]>;
  deleteTenant: (id: string) => Promise<void>;
  saveReading: (reading: Omit<UtilityReading, 'userId'>) => Promise<void>;
  getReadings: (tenantId: string) => Promise<UtilityReading[]>;
  deleteReading: (id: string) => Promise<void>;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export const StorageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [db, setDb] = useState<IDBPDatabase<FieldSnapDB> | null>(null);

  useEffect(() => {
    const initDB = async () => {
      try {
        const dbInstance = await openDB<FieldSnapDB>('field-snap-db', 8, {
          upgrade(db, oldVersion, _newVersion, _transaction) {
            console.log(`Upgrading database from ${oldVersion} to ${_newVersion}`);
            if (!db.objectStoreNames.contains('records')) {
              const store = db.createObjectStore('records', { keyPath: 'id' });
              store.createIndex('by-date', 'timestamp');
              store.createIndex('by-user', 'userId');
            }
            if (!db.objectStoreNames.contains('schedules')) {
              const store = db.createObjectStore('schedules', { keyPath: 'id' });
              store.createIndex('by-user', 'userId');
              store.createIndex('by-date', 'dateTime');
            }
            if (!db.objectStoreNames.contains('forms')) {
              const store = db.createObjectStore('forms', { keyPath: 'id' });
              store.createIndex('by-user', 'userId');
              store.createIndex('by-date', 'date');
            }
            if (!db.objectStoreNames.contains('tenants')) {
              const store = db.createObjectStore('tenants', { keyPath: 'id' });
              store.createIndex('by-user', 'userId');
            }
            if (!db.objectStoreNames.contains('readings')) {
              const store = db.createObjectStore('readings', { keyPath: 'id' });
              store.createIndex('by-user', 'userId');
              store.createIndex('by-tenant', 'tenantId');
            }
          },
        });
        setDb(dbInstance);
      } catch (err) {
        console.error("IndexedDB Init Error:", err);
      }
    };
    initDB();
  }, []);

  const saveRecord = async (record: Omit<FieldRecord, 'userId'>) => {
    if (!db || !user) return;
    try {
      await db.put('records', { ...record, userId: user.id });
    } catch (err) {
      console.error("Error saving record:", err);
    }
  };

  const getRecords = async () => {
    if (!db || !user) return [];
    try {
      const allRecords = await db.getAllFromIndex('records', 'by-user', user.id);
      return allRecords.sort((a, b) => b.timestamp - a.timestamp);
    } catch (err) {
      console.error("Error getting records:", err);
      return [];
    }
  };

  const deleteRecord = async (id: string) => {
    if (!db) return;
    try {
      await db.delete('records', id);
    } catch (err) {
      console.error("Error deleting record:", err);
    }
  };

  const saveSchedule = async (event: Omit<ScheduleEvent, 'userId'>) => {
    if (!db || !user) return;
    try {
      await db.put('schedules', { ...event, userId: user.id });
    } catch (err) {
      console.error("Error saving schedule:", err);
    }
  };

  const getSchedules = async () => {
    if (!db || !user) return [];
    try {
      const all = await db.getAllFromIndex('schedules', 'by-user', user.id);
      return all.sort((a, b) => a.dateTime.localeCompare(b.dateTime));
    } catch (err) {
      console.error("Error getting schedules:", err);
      return [];
    }
  };

  const deleteSchedule = async (id: string) => {
    if (!db) return;
    try {
      await db.delete('schedules', id);
    } catch (err) {
      console.error("Error deleting schedule:", err);
    }
  };

  const saveForm = async (form: Omit<InspectionForm, 'userId'>) => {
    if (!db || !user) return;
    try {
      await db.put('forms', { ...form, userId: user.id });
    } catch (err) {
      console.error("Error saving form:", err);
    }
  };

  const getForms = async () => {
    if (!db || !user) return [];
    try {
      const all = await db.getAllFromIndex('forms', 'by-user', user.id);
      return all.sort((a, b) => b.timestamp - a.timestamp);
    } catch (err) {
      console.error("Error getting forms:", err);
      return [];
    }
  };

  const deleteForm = async (id: string) => {
    if (!db) return;
    try {
      await db.delete('forms', id);
    } catch (err) {
      console.error("Error deleting form:", err);
    }
  };

  const saveTenant = async (tenant: Omit<Tenant, 'userId'>) => {
    if (!db || !user) return;
    try {
      await db.put('tenants', { ...tenant, userId: user.id });
    } catch (err) {
      console.error("Error saving tenant:", err);
    }
  };

  const getTenants = async () => {
    if (!db || !user) return [];
    try {
      const all = await db.getAllFromIndex('tenants', 'by-user', user.id);
      return all.sort((a, b) => b.timestamp - a.timestamp);
    } catch (err) {
      console.error("Error getting tenants:", err);
      return [];
    }
  };

  const deleteTenant = async (id: string) => {
    if (!db) return;
    try {
      await db.delete('tenants', id);
    } catch (err) {
      console.error("Error deleting tenant:", err);
    }
  };

  const saveReading = async (reading: Omit<UtilityReading, 'userId'>) => {
    if (!db || !user) return;
    try {
      await db.put('readings', { ...reading, userId: user.id });
    } catch (err) {
      console.error("Error saving reading:", err);
    }
  };

  const getReadings = async (tenantId: string) => {
    if (!db || !user) return [];
    try {
      const all = await db.getAllFromIndex('readings', 'by-tenant', tenantId);
      return all.sort((a, b) => b.timestamp - a.timestamp);
    } catch (err) {
      console.error("Error getting readings:", err);
      return [];
    }
  };

  const deleteReading = async (id: string) => {
    if (!db) return;
    try {
      await db.delete('readings', id);
    } catch (err) {
      console.error("Error deleting reading:", err);
    }
  };

  return (
    <StorageContext.Provider value={{ 
      saveRecord, getRecords, deleteRecord, 
      saveSchedule, getSchedules, deleteSchedule,
      saveForm, getForms, deleteForm,
      saveTenant, getTenants, deleteTenant,
      saveReading, getReadings, deleteReading
    }}>
      {children}
    </StorageContext.Provider>
  );
};

export const useStorage = () => {
  const context = useContext(StorageContext);
  if (!context) throw new Error('useStorage must be used within a StorageProvider');
  return context;
};
