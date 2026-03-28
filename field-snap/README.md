# FieldSnap

A mobile-first Progressive Web App (PWA) for site documentation and field reporting.

## Features

-   **Camera Capture**: Capture images directly from the app.
-   **Annotation**: Automatically overlay Project Name, Location, Date, Trade, etc., on the image.
-   **Local Storage**: Works offline! Data is saved to your device's browser storage (IndexedDB).
-   **Modern Design**: Clean, responsive UI with dark mode support.

## Getting Started

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Start the App**
    ```bash
    npm run dev -- --host
    ```

3.  **Open in Browser**
    -   Open the link shown in the terminal (e.g., `http://localhost:5173` or your local IP).
    -   On mobile, ensure you are on the same Wi-Fi and use the Network IP.

## Usage

1.  **Login**: Use any email/password (mock authentication).
2.  **Dashboard**: View your saved records.
3.  **Capture**: Tap the `+` button to open the camera.
4.  **Edit**: Fill in the details. The text will be watermarked onto the image.
5.  **Save**: The record is saved locally.

## Troubleshooting

-   **Camera not working?** Ensure your browser has permission to access the camera. Note that `getUserMedia` requires a secure context (HTTPS or localhost). If accessing via local IP (e.g., `192.168.x.x`), you might need to enable "Insecure origins treated as secure" in `chrome://flags` on your mobile device, or use a tunneling service.
