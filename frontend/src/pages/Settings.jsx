import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Download, MessageSquare, Save } from 'lucide-react';

export default function Settings() {
  const { currentUser } = useOutletContext();
  const [botResponse, setBotResponse] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser?.bot_response_template) {
      setBotResponse(currentUser.bot_response_template);
    }
  }, [currentUser]);

  // --- EXPORT LOGIC ---
  const fetchAllData = async () => {
    const { data, error } = await supabase
      .from('receipts')
      .select('*, receipt_items(*)')
      .eq('discord_user_id', currentUser.discord_id);
    if (error) throw error;
    return data;
  };

  const downloadJSON = async () => {
    const data = await fetchAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt_raccoon_export.json`;
    link.click();
  };

  const downloadCSV = async () => {
    const data = await fetchAllData();
    const headers = ['Date', 'Store', 'Total', 'Items'];
    const rows = data.map(r => [
      r.purchase_date,
      r.store_name,
      r.total_amount,
      r.receipt_items.map(i => i.name).join('; ')
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt_raccoon_export.csv`;
    link.click();
  };

  // --- SAVE BOT SETTINGS ---
  const saveBotSettings = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('users')
      .update({ bot_response_template: botResponse })
      .eq('discord_id', currentUser.discord_id);

    if (!error) alert('Settings saved!');
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#2d3748', marginBottom: '32px' }}>Settings</h1>

      {/* DISCORD BOT CUSTOMIZATION */}
      <section style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <MessageSquare size={20} color="#fe6b40" />
          <h2 style={sectionTitleStyle}>Discord Bot Response</h2>
        </div>
        <p style={descriptionStyle}>Customize what the bot says back to you in Discord after it reads your receipt.</p>
        <input
          type="text"
          value={botResponse}
          onChange={(e) => setBotResponse(e.target.value)}
          placeholder="e.g. Thanks for the receipt, Oliver!"
          style={inputStyle}
        />
        <button onClick={saveBotSettings} disabled={saving} style={saveButtonStyle}>
          <Save size={16} /> {saving ? 'Saving...' : 'Save Preference'}
        </button>
      </section>

      {/* DATA EXPORT */}
      <section style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <Download size={20} color="#3b82f6" />
          <h2 style={sectionTitleStyle}>Data Export</h2>
        </div>
        <p style={descriptionStyle}>Download your entire purchase history to keep for your own records.</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={downloadCSV} style={exportButtonStyle}>Export as CSV</button>
          <button onClick={downloadJSON} style={exportButtonStyle}>Export as JSON</button>
        </div>
      </section>
    </div>
  );
}

// --- STYLES ---
const sectionStyle = { background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', marginBottom: '24px' };
const sectionHeaderStyle = { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' };
const sectionTitleStyle = { fontSize: '1.2rem', fontWeight: '700', color: '#2d3748', margin: 0 };
const descriptionStyle = { color: '#718096', fontSize: '0.95rem', marginBottom: '20px' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px', outline: 'none' };
const saveButtonStyle = { background: '#fe6b40', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' };
const exportButtonStyle = { background: 'white', color: '#4a5568', border: '1px solid #e2e8f0', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' };