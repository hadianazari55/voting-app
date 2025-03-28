import React, { useState } from 'react';
import axios from 'axios';
const PORT = process.env.PORT || 3000;

function AdminPanel() {
    const [names, setNames] = useState('');
    const [session, setSession] = useState(null);
    
    const createSession = async () => {
        const namesList = names.split('\n').filter(name => name.trim() !== '');
        const response = await axios.post('/api/sessions', { names: namesList });
        setSession(response.data);
    };
    
    const closeVoting = async () => {
        await axios.post(`/api/sessions/${session.sessionId}/close`, {
            adminCode: session.adminCode
        });
        alert('Voting closed!');
    };
    
    return (
        <div>
            <h1>Create Voting Session</h1>
            <textarea 
                value={names}
                onChange={(e) => setNames(e.target.value)}
                placeholder="Enter names, one per line"
                rows={10}
            />
            <button onClick={createSession}>Create Session</button>
            
            {session && (
                <div>
                    <h2>Session Created!</h2>
                    <p>Share this QR code with participants:</p>
                    <img src={session.qrCode} alt="Join QR Code" />
                    <p>Or share this link: {session.joinUrl}</p>
                    
                    <h3>Admin Controls</h3>
                    <button onClick={closeVoting}>Close Voting</button>
                    <a href={`/results/${session.sessionId}?adminCode=${session.adminCode}`}>
                        View Results
                    </a>
                </div>
            )}
        </div>
    );
}