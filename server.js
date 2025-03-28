 
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory database (replace with real DB in production)
let sessions = {};
let votes = {};

// Create a new voting session
app.post('/api/sessions', (req, res) => {
    const sessionId = uuidv4();
    const { names } = req.body;
    
    sessions[sessionId] = {
        id: sessionId,
        names: names.map(name => ({ id: uuidv4(), text: name })),
        isActive: true,
        createdAt: new Date()
    };
    
    votes[sessionId] = {};
    
    // Generate QR code URL
    const joinUrl = `http://yourdomain.com/join/${sessionId}`;
    
    QRCode.toDataURL(joinUrl, (err, qrCode) => {
        if (err) return res.status(500).send(err);
        
        res.json({
            sessionId,
            qrCode,
            joinUrl,
            adminCode: uuidv4() // For admin to access results
        });
    });
});

// Join a session
app.get('/api/sessions/:id', (req, res) => {
    const session = sessions[req.params.id];
    if (!session || !session.isActive) {
        return res.status(404).send('Session not found or closed');
    }
    res.json(session);
});

// Submit votes
app.post('/api/sessions/:id/votes', (req, res) => {
    const { voterId, selectedNames } = req.body;
    const sessionId = req.params.id;
    
    if (!sessions[sessionId]?.isActive) {
        return res.status(400).send('Voting is closed');
    }
    
    votes[sessionId][voterId] = selectedNames;
    res.json({ success: true });
});

// Get results (admin only)
app.get('/api/sessions/:id/results', (req, res) => {
    const { adminCode } = req.query;
    // In real app, verify admin code matches session's admin code
    
    const session = sessions[req.params.id];
    if (!session) return res.status(404).send('Session not found');
    
    const voteCounts = {};
    session.names.forEach(name => {
        voteCounts[name.id] = 0;
    });
    
    Object.values(votes[req.params.id]).forEach(voterSelections => {
        voterSelections.forEach(nameId => {
            if (voteCounts[nameId] !== undefined) {
                voteCounts[nameId]++;
            }
        });
    });
    
    const results = session.names.map(name => ({
        ...name,
        votes: voteCounts[name.id]
    })).sort((a, b) => b.votes - a.votes);
    
    res.json({
        results,
        winner: results[0] // or handle ties as needed
    });
});

// Close voting
app.post('/api/sessions/:id/close', (req, res) => {
    const { adminCode } = req.body;
    // Verify admin code
    
    if (sessions[req.params.id]) {
        sessions[req.params.id].isActive = false;
        res.json({ success: true });
    } else {
        res.status(404).send('Session not found');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));