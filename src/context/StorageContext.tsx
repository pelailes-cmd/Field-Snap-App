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

export interface InventoryHistory {
  id: string;
  type: 'Add' | 'Pull-out';
  quantity: number;
  person: string;
  department: string;
  location?: string; // For pull-out
  approvedBy?: string; // For pull-out
  timestamp: number;
}

export interface InventoryItem {
  id: string;
  userId: string;
  itemCode: string;
  name: string;
  model?: string;
  quantity: number;
  dateInventory: string;
  requestedBy: string;
  department: string;
  remarks: string;
  history: InventoryHistory[];
  timestamp: number;
}

export interface TaskPersonnel {
  id: string;
  taskId?: string;
  userId: string;
  name: string;
  position: string;
  dutyDates: string;
  expertise: string;
  timestamp: number;
}

export interface PersonnelTask {
  id: string;
  personnelId: string;
  userId: string;
  taskName: string;
  location?: string;
  remarks?: string;
  deadline?: string;
  imageIds?: string[];
  status: 'Pending' | 'Done';
  timestamp: number;
}

export interface MonitoringItem {
  id: string;
  userId: string;
  code: string;
  equipmentName: string;
  location: string;
  status: 'Operational' | 'Not Operational';
  monitoredBy: string;
  remarks: string;
  timestamp: number;
}

export interface MonitoringDailyStatus {
  id: string;
  monitoringId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  status: 'Operational' | 'Not Operational';
  monitoredBy: string;
  remarks: string;
  timestamp: number;
}

export interface MonitoringChecklist {
  id: string;
  monitoringId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  details: string;
  status: 'Okay' | 'Not Okay';
  checkedBy: string;
  remarks: string;
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
  inventory: {
    key: string;
    value: InventoryItem;
    indexes: {
      'by-user': string;
      'by-date': string;
    };
  };
  personnel: {
    key: string;
    value: TaskPersonnel;
    indexes: {
      'by-user': string;
      'by-task': string;
    };
  };
  personnel_tasks: {
    key: string;
    value: PersonnelTask;
    indexes: {
      'by-user': string;
      'by-personnel': string;
    };
  };
  monitoring: {
    key: string;
    value: MonitoringItem;
    indexes: {
      'by-user': string;
    };
  };
  monitoring_daily_status: {
    key: string;
    value: MonitoringDailyStatus;
    indexes: {
      'by-user': string;
      'by-monitoring': string;
      'by-date': string;
    };
  };
  monitoring_checklists: {
    key: string;
    value: MonitoringChecklist;
    indexes: {
      'by-user': string;
      'by-monitoring': string;
      'by-date': string;
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
  saveInventoryItem: (item: Omit<InventoryItem, 'userId'>) => Promise<void>;
  getInventoryItems: () => Promise<InventoryItem[]>;
  deleteInventoryItem: (id: string) => Promise<void>;
  savePersonnel: (personnel: Omit<TaskPersonnel, 'userId'>) => Promise<void>;
  getPersonnel: () => Promise<TaskPersonnel[]>;
  getPersonnelByTask: (taskId: string) => Promise<TaskPersonnel[]>;
  deletePersonnel: (id: string) => Promise<void>;
  savePersonnelTask: (task: Omit<PersonnelTask, 'userId'>) => Promise<void>;
  getPersonnelTasks: (personnelId: string) => Promise<PersonnelTask[]>;
  deletePersonnelTask: (id: string) => Promise<void>;
  saveMonitoringItem: (item: Omit<MonitoringItem, 'userId'>) => Promise<void>;
  getMonitoringItems: () => Promise<MonitoringItem[]>;
  deleteMonitoringItem: (id: string) => Promise<void>;
  saveMonitoringDailyStatus: (status: Omit<MonitoringDailyStatus, 'userId'>) => Promise<void>;
  getMonitoringDailyStatus: (monitoringId: string, date: string) => Promise<MonitoringDailyStatus | undefined>;
  getAllMonitoringDailyStatus: (date: string) => Promise<MonitoringDailyStatus[]>;
  saveMonitoringChecklist: (checklist: Omit<MonitoringChecklist, 'userId'>) => Promise<void>;
  getMonitoringChecklists: (monitoringId: string) => Promise<MonitoringChecklist[]>;
  getLatestMonitoringChecklists: (monitoringId: string) => Promise<MonitoringChecklist[]>;
  deleteMonitoringChecklist: (id: string) => Promise<void>;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export const StorageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [db, setDb] = useState<IDBPDatabase<FieldSnapDB> | null>(null);

  useEffect(() => {
    const initDB = async () => {
      try {
        const dbInstance = await openDB<FieldSnapDB>('field-snap-db', 14, {
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
            if (!db.objectStoreNames.contains('inventory')) {
              const store = db.createObjectStore('inventory', { keyPath: 'id' });
              store.createIndex('by-user', 'userId');
              store.createIndex('by-date', 'dateInventory');
            }
            if (!db.objectStoreNames.contains('personnel')) {
              const store = db.createObjectStore('personnel', { keyPath: 'id' });
              store.createIndex('by-user', 'userId');
              store.createIndex('by-task', 'taskId');
            }
            if (!db.objectStoreNames.contains('personnel_tasks')) {
              const store = db.createObjectStore('personnel_tasks', { keyPath: 'id' });
              store.createIndex('by-user', 'userId');
              store.createIndex('by-personnel', 'personnelId');
            }
            if (!db.objectStoreNames.contains('monitoring')) {
              const store = db.createObjectStore('monitoring', { keyPath: 'id' });
              store.createIndex('by-user', 'userId');
            }
            if (!db.objectStoreNames.contains('monitoring_daily_status')) {
              const store = db.createObjectStore('monitoring_daily_status', { keyPath: 'id' });
              store.createIndex('by-user', 'userId');
              store.createIndex('by-monitoring', 'monitoringId');
              store.createIndex('by-date', 'date');
            }
            if (!db.objectStoreNames.contains('monitoring_checklists')) {
              const store = db.createObjectStore('monitoring_checklists', { keyPath: 'id' });
              store.createIndex('by-user', 'userId');
              store.createIndex('by-monitoring', 'monitoringId');
              store.createIndex('by-date', 'date');
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

  const saveInventoryItem = async (item: Omit<InventoryItem, 'userId'>) => {
    if (!db || !user) return;
    try {
      await db.put('inventory', { ...item, userId: user.id });
    } catch (err) {
      console.error("Error saving inventory item:", err);
    }
  };

  const getInventoryItems = async () => {
    if (!db || !user) return [];
    try {
      const all = await db.getAllFromIndex('inventory', 'by-user', user.id);
      return all.sort((a, b) => b.timestamp - a.timestamp);
    } catch (err) {
      console.error("Error getting inventory items:", err);
      return [];
    }
  };

  const deleteInventoryItem = async (id: string) => {
    if (!db) return;
    try {
      await db.delete('inventory', id);
    } catch (err) {
      console.error("Error deleting inventory item:", err);
    }
  };

  const savePersonnel = async (personnel: Omit<TaskPersonnel, 'userId'>) => {
    if (!db || !user) return;
    try {
      await db.put('personnel', { ...personnel, userId: user.id });
    } catch (err) {
      console.error("Error saving personnel:", err);
    }
  };

  const getPersonnelByTask = async (taskId: string) => {
    if (!db || !user) return [];
    try {
      const all = await db.getAllFromIndex('personnel', 'by-task', taskId);
      return all.filter(p => p.userId === user.id).sort((a, b) => b.timestamp - a.timestamp);
    } catch (err) {
      console.error("Error getting personnel by task:", err);
      return [];
    }
  };

  const getPersonnel = async () => {
    if (!db || !user) return [];
    try {
      const all = await db.getAllFromIndex('personnel', 'by-user', user.id);
      return all.sort((a, b) => b.timestamp - a.timestamp);
    } catch (err) {
      console.error("Error getting all personnel:", err);
      return [];
    }
  };

  const deletePersonnel = async (id: string) => {
    if (!db) return;
    try {
      await db.delete('personnel', id);
    } catch (err) {
      console.error("Error deleting personnel:", err);
    }
  };

  const savePersonnelTask = async (task: Omit<PersonnelTask, 'userId'>) => {
    if (!db || !user) return;
    try {
      await db.put('personnel_tasks', { ...task, userId: user.id });
    } catch (err) {
      console.error("Error saving personnel task:", err);
    }
  };

  const getPersonnelTasks = async (personnelId: string) => {
    if (!db || !user) return [];
    try {
      const all = await db.getAllFromIndex('personnel_tasks', 'by-personnel', personnelId);
      return all.filter(p => p.userId === user.id).sort((a, b) => b.timestamp - a.timestamp);
    } catch (err) {
      console.error("Error getting personnel tasks:", err);
      return [];
    }
  };

  const deletePersonnelTask = async (id: string) => {
    if (!db) return;
    try {
      await db.delete('personnel_tasks', id);
    } catch (err) {
      console.error("Error deleting personnel task:", err);
    }
  };

  const saveMonitoringItem = async (item: Omit<MonitoringItem, 'userId'>) => {
    if (!db || !user) return;
    try {
      await db.put('monitoring', { ...item, userId: user.id });
    } catch (err) {
      console.error("Error saving monitoring item:", err);
    }
  };

  const getMonitoringItems = async () => {
    if (!db || !user) return [];
    try {
      const all = await db.getAllFromIndex('monitoring', 'by-user', user.id);
      return all.sort((a, b) => b.timestamp - a.timestamp);
    } catch (err) {
      console.error("Error getting monitoring items:", err);
      return [];
    }
  };

  const deleteMonitoringItem = async (id: string) => {
    if (!db) return;
    try {
      await db.delete('monitoring', id);
    } catch (err) {
      console.error("Error deleting monitoring item:", err);
    }
  };

  const saveMonitoringDailyStatus = async (status: Omit<MonitoringDailyStatus, 'userId'>) => {
    if (!db || !user) return;
    try {
      await db.put('monitoring_daily_status', { ...status, userId: user.id });
    } catch (err) {
      console.error("Error saving monitoring daily status:", err);
    }
  };

  const getMonitoringDailyStatus = async (monitoringId: string, date: string) => {
    if (!db || !user) return undefined;
    try {
      const results = await db.getAllFromIndex('monitoring_daily_status', 'by-monitoring', monitoringId);
      return results.find(r => r.userId === user.id && r.date === date);
    } catch (err) {
      console.error("Error getting monitoring daily status:", err);
      return undefined;
    }
  };

  const getAllMonitoringDailyStatus = async (date: string) => {
    if (!db || !user) return [];
    try {
      const results = await db.getAllFromIndex('monitoring_daily_status', 'by-date', date);
      return results.filter(r => r.userId === user.id);
    } catch (err) {
      console.error("Error getting all monitoring daily status:", err);
      return [];
    }
  };

  const saveMonitoringChecklist = async (checklist: Omit<MonitoringChecklist, 'userId'>) => {
    if (!db || !user) return;
    try {
      await db.put('monitoring_checklists', { ...checklist, userId: user.id });
    } catch (err) {
      console.error("Error saving monitoring checklist:", err);
    }
  };

  const getMonitoringChecklists = async (monitoringId: string) => {
    if (!db || !user) return [];
    try {
      const all = await db.getAllFromIndex('monitoring_checklists', 'by-monitoring', monitoringId);
      return all.filter(c => c.userId === user.id).sort((a, b) => b.timestamp - a.timestamp);
    } catch (err) {
      console.error("Error getting monitoring checklists:", err);
      return [];
    }
  };

  const getLatestMonitoringChecklists = async (monitoringId: string) => {
    if (!db || !user) return [];
    try {
      const all = await db.getAllFromIndex('monitoring_checklists', 'by-monitoring', monitoringId);
      const userItems = all.filter(c => c.userId === user.id);
      if (userItems.length === 0) return [];
      
      // Find the latest date
      const latestDate = userItems.reduce((max, item) => item.date > max ? item.date : max, userItems[0].date);
      return userItems.filter(c => c.date === latestDate);
    } catch (err) {
      console.error("Error getting latest monitoring checklists:", err);
      return [];
    }
  };

  const deleteMonitoringChecklist = async (id: string) => {
    if (!db) return;
    try {
      await db.delete('monitoring_checklists', id);
    } catch (err) {
      console.error("Error deleting monitoring checklist:", err);
    }
  };

  return (
    <StorageContext.Provider value={{ 
      saveRecord, getRecords, deleteRecord, 
      saveSchedule, getSchedules, deleteSchedule,
      saveForm, getForms, deleteForm,
      saveTenant, getTenants, deleteTenant,
      saveReading, getReadings, deleteReading,
      saveInventoryItem, getInventoryItems, deleteInventoryItem,
      savePersonnel, getPersonnel, getPersonnelByTask, deletePersonnel,
      savePersonnelTask, getPersonnelTasks, deletePersonnelTask,
      saveMonitoringItem, getMonitoringItems, deleteMonitoringItem,
      saveMonitoringDailyStatus, getMonitoringDailyStatus, getAllMonitoringDailyStatus,
      saveMonitoringChecklist, getMonitoringChecklists, getLatestMonitoringChecklists, deleteMonitoringChecklist
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
