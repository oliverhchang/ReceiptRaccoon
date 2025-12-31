// src/pages/Instructions.jsx
import React from 'react'
import { MessageSquare, UploadCloud, PieChart, Camera, CheckCircle, Smartphone, Terminal } from 'lucide-react'

export default function Instructions() {
  return (
    <div className="dashboard-container" style={{maxWidth: '1000px', margin: '0 auto', paddingBottom: '60px'}}>

      {/* HEADER */}
      <div style={{ marginBottom: '50px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#2d3748', margin: '0 0 16px 0' }}>
          How to use <span style={{color: '#fe6b40'}}>Receipt Raccoon</span>
        </h1>
        <p style={{ color: '#718096', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Your guide to tracking expenses effortlessly using our Discord Bot and Dashboard.
        </p>
      </div>

      {/* --- STEP 1: UPLOAD --- */}
      <section style={{marginBottom: '60px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px'}}>
          <div style={iconBoxStyle}><UploadCloud size={24} color="#fe6b40" /></div>
          <h2 style={headerStyle}>1. Uploading Receipts</h2>
        </div>

        <div style={cardGridStyle}>
          <InstructionCard
            title="Snap a Photo"
            text="Take a clear picture of your grocery receipt. Make sure the store name, date, and total are visible."
            icon={<Camera size={28} color="#4a5568"/>}
          />
          <InstructionCard
            title="Send to Discord"
            text="Drag and drop the image into the Discord channel where the bot is active. No special commands needed!"
            icon={<MessageSquare size={28} color="#5865F2"/>}
          />
          <InstructionCard
            title="Wait for the Check"
            text="The bot will reply with a ✅ reaction when it has finished reading and saving your data."
            icon={<CheckCircle size={28} color="#10b981"/>}
          />
        </div>
      </section>

      {/* --- STEP 2: DASHBOARD --- */}
      <section style={{marginBottom: '60px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px'}}>
          <div style={{...iconBoxStyle, background: '#ebf8ff'}}><PieChart size={24} color="#3b82f6" /></div>
          <h2 style={headerStyle}>2. The Dashboard</h2>
        </div>

        <div style={{background: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)'}}>
          <ul style={{display: 'flex', flexDirection: 'column', gap: '20px', paddingLeft: '20px', margin: 0}}>
            <li style={listItemStyle}>
              <strong>Overview:</strong> See your monthly spending trends and average trip costs instantly.
            </li>
            <li style={listItemStyle}>
              <strong>Category Breakdown:</strong> We automatically categorize items (e.g., "Meat/Fish", "Dairy") so you know where your money goes.
            </li>
            <li style={listItemStyle}>
              <strong>Manual Entry:</strong> Forgot to take a pic? Use the <span style={{background:'#edf2f7', padding:'2px 6px', borderRadius:'4px', fontSize:'0.85rem'}}>+ Add Receipt</span> button in the right sidebar.
            </li>
          </ul>
        </div>
      </section>

      {/* --- STEP 3: TIPS --- */}
      <section style={{marginBottom: '60px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px'}}>
          <div style={{...iconBoxStyle, background: '#f0fff4'}}><Smartphone size={24} color="#10b981" /></div>
          <h2 style={headerStyle}>3. Pro Tips</h2>
        </div>

        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px'}}>
          <div style={{background: '#fffaf0', padding: '24px', borderRadius: '12px', border: '1px solid #feebc8'}}>
            <h3 style={{marginTop: 0, color: '#c05621', fontSize: '1.1rem'}}>Inflation Tracker</h3>
            <p style={{color: '#744210', fontSize: '0.95rem', lineHeight: '1.5'}}>
              Check the <strong>Inflation</strong> tab to compare prices of specific items (like "Eggs") across the entire server history to see if prices are rising.
            </p>
          </div>
          <div style={{background: '#f7fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
            <h3 style={{marginTop: 0, color: '#2d3748', fontSize: '1.1rem'}}>Budget Goals</h3>
            <p style={{color: '#4a5568', fontSize: '0.95rem', lineHeight: '1.5'}}>
              Set your monthly budget in the right sidebar. The bar will turn <span style={{color: '#e53e3e', fontWeight: 'bold'}}>Red</span> if you get close to your limit!
            </p>
          </div>
        </div>
      </section>

      {/* --- STEP 4: RASPBERRY PI SETUP --- */}
      <section>
        <div style={{display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px'}}>
          <div style={{...iconBoxStyle, background: '#2d3748'}}><Terminal size={24} color="#fff" /></div>
          <h2 style={headerStyle}>4. Pi Server Maintenance</h2>
        </div>

        <div style={{background: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)'}}>
          <p style={{color: '#718096', marginBottom: '20px'}}>Use these commands to manage the bot on the Raspberry Pi.</p>

          <div style={{display: 'grid', gap: '20px'}}>

            {/* Command 1 */}
            <div style={commandBoxStyle}>
              <div style={commandTitleStyle}>Connect to Pi</div>
              <code style={codeBlockStyle}>ssh oliverhchang@oliverhchang.local</code>
            </div>

            {/* Command 2 */}
            <div style={commandBoxStyle}>
              <div style={commandTitleStyle}>Check Status (PM2)</div>
              <code style={codeBlockStyle}>pm2 list</code>
              <p style={commentStyle}>Shows if 'raccoon-bot' and dashboard are online.</p>
            </div>

            {/* Command 3 */}
            <div style={commandBoxStyle}>
              <div style={commandTitleStyle}>Update & Restart Bot</div>
              <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                <code style={codeBlockStyle}>cd ReceiptRaccoon/backend</code>
                <code style={codeBlockStyle}>pm2 restart raccoon-bot</code>
              </div>
              <p style={commentStyle}>Run this after uploading new code.</p>
            </div>

             {/* Command 4 */}
             <div style={commandBoxStyle}>
              <div style={commandTitleStyle}>View Logs</div>
              <code style={codeBlockStyle}>pm2 logs raccoon-bot</code>
              <p style={commentStyle}>Use this to see errors or print statements in real-time.</p>
            </div>

          </div>
        </div>
      </section>

    </div>
  )
}

// --- SUB-COMPONENTS & STYLES ---

function InstructionCard({ title, text, icon }) {
  return (
    <div style={{
      background: 'white', padding: '24px', borderRadius: '16px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.02)', textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center'
    }}>
      <div style={{marginBottom: '16px', background: '#f7fafc', padding: '16px', borderRadius: '50%'}}>
        {icon}
      </div>
      <h3 style={{margin: '0 0 10px 0', fontSize: '1.1rem', color: '#2d3748'}}>{title}</h3>
      <p style={{margin: 0, color: '#718096', fontSize: '0.95rem', lineHeight: '1.5'}}>{text}</p>
    </div>
  )
}

const headerStyle = { fontSize: '1.5rem', fontWeight: '700', color: '#2d3748', margin: 0 }
const iconBoxStyle = { width: '40px', height: '40px', borderRadius: '10px', background: '#fff5f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }
const cardGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }
const listItemStyle = { color: '#4a5568', fontSize: '1rem', lineHeight: '1.6' }

// New Styles for the Code Section
const commandBoxStyle = { borderBottom: '1px solid #edf2f7', paddingBottom: '16px' }
const commandTitleStyle = { fontSize: '0.95rem', fontWeight: '600', color: '#2d3748', marginBottom: '8px' }
const codeBlockStyle = {
  background: '#2d3748',
  color: '#4fd1c5',
  padding: '8px 12px',
  borderRadius: '6px',
  fontFamily: 'monospace',
  fontSize: '0.9rem',
  display: 'block',
  width: 'fit-content'
}
const commentStyle = { color: '#a0aec0', fontSize: '0.85rem', marginTop: '6px', fontStyle: 'italic', margin: '6px 0 0 0' }