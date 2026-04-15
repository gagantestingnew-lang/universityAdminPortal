"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

interface HallTicketData {
  studentId: string;
  studentName: string;
  examName: string;
  totalClasses: number;
  attendedClasses: number;
  attendancePercentage: string;
  examFeePaid: boolean;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [attendanceStudentId, setAttendanceStudentId] = useState('');
  const [hallTicketStudentId, setHallTicketStudentId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalColor, setModalColor] = useState('#eef2ff');
  const [hallTicketData, setHallTicketData] = useState<HallTicketData | null>(null);
  const [modalType, setModalType] = useState(''); // 'attendance' or 'hallticket'
  const [generatedHallTicketNumber, setGeneratedHallTicketNumber] = useState<string | null>(null);

  const handleAttendanceCheck = async () => {
    if (!attendanceStudentId) return;

    // Fetch student data from Supabase
    const { data, error } = await supabase
      .from('students')
      .select('studentid, studentname, totalclasses, attendedclasses')
      .eq('studentid', attendanceStudentId)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      setModalStatus('Error');
      setModalMessage('Error fetching data: ' + error.message);
      setModalColor('red');
      setModalType('attendance');
      setIsModalOpen(true);
      return;
    }

    if (!data) {
      setModalStatus('Not found');
      setModalMessage('Student not found.');
      setModalColor('red');
      setModalType('attendance');
      setIsModalOpen(true);
      return;
    }

    // Prepare payload
    const payload = {
      studentId: data.studentid,
      studentName: data.studentname,
      totalClasses: data.totalclasses,
      attendedClasses: data.attendedclasses,
    };

    // Send to Azure Logic App
    try {
      const response = await fetch('https://prod-00.southindia.logic.azure.com:443/workflows/29fbf59b17794bc7bf967e480af01302/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=vsQD7jX-plIzPx6UbNNgguyP4e0EbqjWpZjVxLZVJhs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      const message = (result.message ?? '').toString();
      const status = (result.status ?? '').toString();
      const normalizedText = `${status} ${message}`.toLowerCase();
      const textColor = normalizedText.includes('not eligible')
        ? 'red'
        : normalizedText.includes('eligible')
        ? 'green'
        : '#eef2ff';
      setModalStatus(status);
      setModalMessage(message);
      setModalColor(textColor);
      setModalType('attendance');
    } catch (err) {
      setModalStatus('Error');
      setModalMessage('Error sending request: ' + (err as Error).message);
      setModalColor('red');
      setModalType('attendance');
    }

    setIsModalOpen(true);
  };

  const handleHallTicketGeneration = async () => {
    if (!hallTicketStudentId) return;

    // Fetch student data from Supabase
    const { data, error } = await supabase
      .from('students')
      .select('studentid, studentname, examname, totalclasses, attendedclasses, examfeepaid')
      .eq('studentid', hallTicketStudentId)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      setModalStatus('Error');
      setModalMessage('Error fetching data: ' + error.message);
      setModalColor('red');
      setModalType('hallticket');
      setIsModalOpen(true);
      return;
    }

    if (!data) {
      setModalStatus('Not found');
      setModalMessage('Student not found.');
      setModalColor('red');
      setModalType('hallticket');
      setIsModalOpen(true);
      return;
    }

    // Calculate attendance percentage
    const attendancePercentage = data.totalclasses > 0
      ? ((data.attendedclasses / data.totalclasses) * 100).toFixed(2)
      : '0.00';

    // Set hall ticket data
    setHallTicketData({
      studentId: data.studentid,
      studentName: data.studentname,
      examName: data.examname,
      totalClasses: data.totalclasses,
      attendedClasses: data.attendedclasses,
      attendancePercentage: attendancePercentage,
      examFeePaid: data.examfeepaid
    });

    setModalType('hallticket');
    setIsModalOpen(true);
  };

  const handleGenerateHallTicketNumber = async () => {
    if (!hallTicketData) return;

    const payload = {
      studentId: hallTicketData.studentId,
      studentName: hallTicketData.studentName,
      examName: hallTicketData.examName,
      attendancePercentage: Math.round(parseFloat(hallTicketData.attendancePercentage)),
      examFeePaid: hallTicketData.examFeePaid
    };

    try {
      const response = await fetch('https://prod-23.southindia.logic.azure.com:443/workflows/3bfd8c8bde7f437f8c2f7dc2c74855f1/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=OVKp8c7pGiLr1OfhPJIEU49A4h_GJef742mMvzKk8_4', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && (result.hallTicketNumber || result.hallticketnumber)) {
        setGeneratedHallTicketNumber(result.hallTicketNumber || result.hallticketnumber);
      } else {
        // Extract error message from response
        const errorMessage = result.message || result.error || result.reason || 'Unknown error occurred';
        setGeneratedHallTicketNumber(`Failed: ${errorMessage}`);
        console.error('Hall ticket generation failed:', result);
      }
    } catch (err) {
      console.error('Error generating hall ticket number:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error occurred';
      setGeneratedHallTicketNumber(`Failed: ${errorMessage}`);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalStatus('');
    setModalMessage('');
    setModalColor('#eef2ff');
    setHallTicketData(null);
    setModalType('');
    setGeneratedHallTicketNumber(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <main className="dashboard-shell">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Admin Dashboard</h1>
          <p>Welcome to the Fireflink University admin portal.</p>
        </div>
        <button 
          onClick={handleLogout}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
            color: '#fff',
            border: 'none',
            borderRadius: '18px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, filter 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.filter = 'brightness(1.1)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.filter = 'brightness(1)';
          }}
        >
          Logout
        </button>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h2>Attendance Eligibility Check</h2>
          <div className="card-content">
            <label htmlFor="attendance-student-id">Student ID</label>
            <input
              id="attendance-student-id"
              type="text"
              value={attendanceStudentId}
              onChange={(e) => setAttendanceStudentId(e.target.value)}
              placeholder="Enter student ID"
            />
            <button className="check-button" onClick={handleAttendanceCheck}>
              Check
            </button>
          </div>
        </div>

        <div className="dashboard-card">
          <h2>Hall Ticket Generation</h2>
          <div className="card-content">
            <label htmlFor="hall-ticket-student-id">Student ID</label>
            <input
              id="hall-ticket-student-id"
              type="text"
              value={hallTicketStudentId}
              onChange={(e) => setHallTicketStudentId(e.target.value)}
              placeholder="Enter student ID"
            />
            <button className="check-button" onClick={handleHallTicketGeneration}>
              Check
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>×</button>
            {modalType === 'hallticket' && hallTicketData ? (
              <div className="modal-text">
                {generatedHallTicketNumber ? (
                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{ marginBottom: '1rem', color: '#eef2ff' }}>
                      {generatedHallTicketNumber.startsWith('Failed:') ? 'Hall Ticket Generation Failed' : 'Hall Ticket Generated'}
                    </h3>
                    <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
                      <strong>Student ID:</strong> {hallTicketData.studentId}
                    </div>
                    <div style={{ 
                      fontSize: '1.2rem', 
                      color: generatedHallTicketNumber.startsWith('Failed:') ? '#ef4444' : '#22d3ee' 
                    }}>
                      <strong>Hall Ticket Number:</strong> {generatedHallTicketNumber}
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: '#eef2ff' }}>Hall Ticket Details</h3>
                    <div style={{ display: 'grid', gap: '0.5rem', textAlign: 'left', marginBottom: '1.5rem' }}>
                      <div><strong>Student ID:</strong> {hallTicketData.studentId}</div>
                      <div><strong>Student Name:</strong> {hallTicketData.studentName}</div>
                      <div><strong>Exam Name:</strong> {hallTicketData.examName}</div>
                      <div><strong>Total Classes:</strong> {hallTicketData.totalClasses}</div>
                      <div><strong>Attended Classes:</strong> {hallTicketData.attendedClasses}</div>
                      <div><strong>Attendance Percentage:</strong> {hallTicketData.attendancePercentage}%</div>
                      <div><strong>Exam Fee Paid:</strong> {hallTicketData.examFeePaid ? 'Yes' : 'No'}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <button 
                        className="check-button" 
                        onClick={handleGenerateHallTicketNumber}
                        style={{ width: 'auto', padding: '0.75rem 1.5rem' }}
                      >
                        Generate Hall Ticket Number
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="modal-text" style={{ color: modalColor }}>
                <strong>{modalStatus}</strong>
                <br />
                {modalMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
