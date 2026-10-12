import { describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import App from '../App';
import { clearAllFileRecords } from '../services/db';

describe('User Interactions and App Integration', () => {
  beforeEach(async () => {
    await clearAllFileRecords();
  });

  it('renders the initial application dashboard with zero stats', async () => {
    render(<App />);

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByText(/Smart File Organizer/i)).toBeInTheDocument();
    });

    expect(screen.getAllByText(/Stored Files/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Reclaimable Space/i)).toBeInTheDocument();
  });

  it('loads sample files and updates dashboard statistics', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Smart File Organizer/i)).toBeInTheDocument();
    });

    // Click "Load Sample Files"
    const loadSampleBtn = screen.getByRole('button', { name: /Load Sample Files/i });
    fireEvent.click(loadSampleBtn);

    // Verify stats update and duplicate detection runs
    await waitFor(
      () => {
        expect(screen.queryByText(/No files uploaded yet/i)).not.toBeInTheDocument();
        expect(screen.getByText(/Duplicates Found/i)).toBeInTheDocument();
      },
      { timeout: 15000 }
    );
  }, 20000);

  it('navigates across tabs correctly (My Files, Duplicate Lab, Settings)', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Smart File Organizer/i)).toBeInTheDocument();
    });

    // Navigate to Settings
    const settingsBtn = screen.getByRole('button', { name: /Settings/i });
    fireEvent.click(settingsBtn);

    await waitFor(() => {
      expect(screen.getByText(/Settings & Storage Preferences/i)).toBeInTheDocument();
      expect(screen.getByText(/Browser Storage Quota/i)).toBeInTheDocument();
    });

    // Navigate to Duplicate Lab
    const duplicatesBtn = screen.getByRole('button', { name: /Duplicate Lab/i });
    fireEvent.click(duplicatesBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Duplicate Lab/i })).toBeInTheDocument();
    });

    // Navigate to My Files
    const filesBtn = screen.getByRole('button', { name: /My Files/i });
    fireEvent.click(filesBtn);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search by filename/i)).toBeInTheDocument();
    });
  });

  it('opens and closes the file upload modal', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Smart File Organizer/i)).toBeInTheDocument();
    });

    const uploadBtn = screen.getAllByRole('button', { name: /Upload Files/i })[0];
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      expect(screen.getByText(/Upload Local Files/i)).toBeInTheDocument();
      expect(screen.getByText(/Drag and drop files here/i)).toBeInTheDocument();
    });

    const doneBtn = screen.getByRole('button', { name: /Done/i });
    fireEvent.click(doneBtn);

    await waitFor(() => {
      expect(screen.queryByText(/Upload Local Files/i)).not.toBeInTheDocument();
    });
  });

  it('transitions to landing page on logout and allows returning to dashboard', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Smart File Organizer/i)).toBeInTheDocument();
    });

    // Navigate to Settings
    const settingsBtn = screen.getByRole('button', { name: /Settings/i });
    fireEvent.click(settingsBtn);

    await waitFor(() => {
      expect(screen.getByText(/Settings & Storage Preferences/i)).toBeInTheDocument();
    });

    // Click Log Out button in Navbar
    const logoutBtn = screen.getAllByRole('button', { name: /Log Out/i })[0];
    fireEvent.click(logoutBtn);

    // Verify redirected to full-width Landing Page with notice
    await waitFor(() => {
      expect(screen.getByText(/Logged out successfully/i)).toBeInTheDocument();
      expect(screen.getByText(/Zero-Cloud, high-performance browser organizer/i)).toBeInTheDocument();
    });

    // Click Go to Dashboard button from Landing Page
    const goToDashBtn = screen.getAllByRole('button', { name: /Go to Dashboard/i })[0];
    fireEvent.click(goToDashBtn);

    // Verify Login modal opens
    await waitFor(() => {
      expect(screen.getByText(/Log In to Local Workspace/i)).toBeInTheDocument();
    });

    // Click One-Click Quick Login
    const quickLoginBtn = screen.getByRole('button', { name: /One-Click Quick Login/i });
    fireEvent.click(quickLoginBtn);

    // Verify back inside workspace dashboard
    await waitFor(() => {
      expect(screen.getAllByText(/Stored Files/i)[0]).toBeInTheDocument();
    });
  });
});
