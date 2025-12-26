import React from 'react';
import { Cpu, Database, MessageSquare, LineChart, Code2, Globe, ShieldCheck, Zap, Layers, Share2, Terminal, ArrowRight } from 'lucide-react';

export default function CodeExplanation() {
  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '60px 20px', fontFamily: 'Inter, system-ui, sans-serif', color: '#2d3748' }}>

      {/* --- HERO SECTION --- */}
      <header style={{ marginBottom: '80px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: '900', color: '#1a202c', letterSpacing: '-2px', marginBottom: '15px' }}>
          How It Works
        </h1>
        <p style={{ color: '#718096', fontSize: '1.25rem', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
          Big picture overview of project architecture
        </p>
      </header>

      {/* --- PHASE 1: UPLOADING --- */}
      <section style={sectionWrapper}>
        <div style={mainContent}>
          <div style={headerGroup}>
            <MessageSquare color="#fe6b40" size={40} />
            <h2 style={h2Style}>Discord Bot</h2>
          </div>
          <p style={pStyle}>
            A Discord Bot was the simplest UI used to take photos without requring any external apps or websites. After a photo is posted the <strong>Discord Bot</strong> (written in Python) jumps into action. It "listens" for new messages and checks if they contain an image.
          </p>
          <div style={infoGrid}>
            <div style={infoCard}>
              <Terminal size={20} color="#fe6b40" />
              <h4>Multi-Tasking</h4>
              <p>We use <strong>Asynchronous</strong> code. This means the bot can process five people's receipts at the same time without getting stuck or waiting for one to finish before starting the next.</p>
            </div>
            <div style={infoCard}>
              <Share2 size={20} color="#fe6b40" />
              <h4>Cloud Storage</h4>
              <p>We don't save photos on a computer; we send them to <strong>Supabase Storage</strong>. Each photo gets a "UUID" (a unique code) so no two files ever get mixed up.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- PHASE 2: THINKING --- */}
      <section style={sectionWrapper}>
        <div style={mainContent}>
          <div style={headerGroup}>
            <Cpu color="#3b82f6" size={40} />
            <h2 style={h2Style}>Image Processing</h2>
          </div>
          <p style={pStyle}>
            <strong>Google Gemini 1.5 Flash</strong> does the image processing and breaks down each receipt to the store, date, and list of items bought.
          </p>

          <p style={pStyle}>
            For example, if it sees "Milk," it knows to label it under <code>Dairy & Eggs</code>. If it sees "Apples," it picks <code>Fruits</code>.
          </p>
        </div>
      </section>

      {/* --- PHASE 3: SAVING --- */}
      <section style={sectionWrapper}>
        <div style={mainContent}>
          <div style={headerGroup}>
            <Database color="#10b981" size={40} />
            <h2 style={h2Style}>Supabase Storage</h2>
          </div>

          <div style={schemaLayout}>
            <div style={tableNode}>
              <div style={tableHeader}>Users</div>
              <div style={tableBody}>Your Discord ID<br/>Your Name<br/>Your Budget</div>
            </div>
            <ArrowRight color="#cbd5e0" />
            <div style={tableNode}>
              <div style={tableHeader}>Receipts</div>
              <div style={tableBody}>Store Name<br/>Total Cost<br/>Image Link</div>
            </div>
            <ArrowRight color="#cbd5e0" />
            <div style={tableNode}>
              <div style={tableHeader}>Items</div>
              <div style={tableBody}>Milk - $4.00<br/>Eggs - $5.00<br/>Category</div>
            </div>
          </div>
          <p style={{...pStyle, marginTop: '20px', fontSize: '1rem'}}>
            Because these tables are "Related," we can ask the computer: "Show me every single item from a specific User from Trader Joe's in December.
          </p>
        </div>
      </section>

      {/* --- PHASE 4: SHOWING --- */}
      <section style={sectionWrapper}>
        <div style={mainContent}>
          <div style={headerGroup}>
            <LineChart color="#805ad5" size={40} />
            <h2 style={h2Style}>The React Dashboard</h2>
          </div>
          <p style={pStyle}>
            Finally, the <strong>React Dashboard</strong> gives the user a place to see the data.
          </p>
          <ul style={featureList}>
            <li><strong>Global Context:</strong> We use a tool called <code>useOutletContext</code> so the app always knows which user you are looking at, no matter which page you click on.</li>
            <li><strong>Live Charts:</strong> We use <strong>Recharts</strong> to draw the graphs. These aren't just images; they are <strong>SVGs</strong> drawn by code, so they stay crisp and clear even if you zoom in.</li>
          </ul>
        </div>
      </section>

      {/* --- TECH STACK SUMMARY --- */}
      <footer style={footerStyle}>
        <div style={techTag}><Zap size={18} /> Vite (Fast Build)</div>
        <div style={techTag}><Globe size={18} /> Supabase (Database)</div>
        <div style={techTag}><ShieldCheck size={18} /> Gemini (Image Process)</div>
        <div style={techTag}><Layers size={18} /> React (Interface)</div>
      </footer>
    </div>
  );
}

// --- STYLES ---
const sectionWrapper = { display: 'flex', gap: '60px', marginBottom: '100px', alignItems: 'flex-start' };
const sidebarLabel = { fontSize: '0.75rem', fontWeight: '900', color: '#cbd5e0', textTransform: 'uppercase', letterSpacing: '3px', writingMode: 'vertical-rl', transform: 'rotate(180deg)', borderRight: '1px solid #e2e8f0', paddingRight: '20px' };
const mainContent = { flex: 1 };
const headerGroup = { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '25px' };
const h2Style = { fontSize: '2.2rem', fontWeight: '800', color: '#1a202c', margin: 0 };
const pStyle = { fontSize: '1.15rem', color: '#4a5568', lineHeight: '1.8', marginBottom: '30px' };
const infoGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' };
const infoCard = { background: '#f8fafc', padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0' };
const annotationBox = { background: '#fff5f0', padding: '25px', borderRadius: '16px', borderLeft: '5px solid #fe6b40', marginBottom: '30px', color: '#7c2d12' };
const schemaLayout = { display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '30px', background: '#f1f5f9', borderRadius: '20px' };
const tableNode = { background: 'white', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', width: '180px', overflow: 'hidden' };
const tableHeader = { background: '#2d3748', color: 'white', padding: '10px', fontSize: '0.85rem', fontWeight: '700', textAlign: 'center' };
const tableBody = { padding: '15px', fontSize: '0.8rem', color: '#4a5568', lineHeight: '1.7' };
const featureList = { listStyle: 'none', padding: 0, color: '#4a5568', display: 'grid', gap: '20px' };
const footerStyle = { marginTop: '50px', padding: '50px', background: '#1a202c', borderRadius: '30px', display: 'flex', justifyContent: 'space-around', color: 'white' };
const techTag = { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem', fontWeight: '600' };