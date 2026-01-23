import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, X, ShoppingBag, DollarSign, Tag, Package } from 'lucide-react';

export default function ManualReceiptForm({ onReceiptAdded, currentUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [store, setStore] = useState('');
  const [itemName, setItemName] = useState('');
  const [total, setTotal] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Uncategorized');

  const categories = [
    "Groceries", "Restaurants & Dining", "Transportation",
    "Home & Utilities", "Shopping & Entertainment", "Uncategorized"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser || !currentUser.discord_id) {
        alert("Error: User context missing. Please reload.");
        return;
    }

    setLoading(true);

    try {
      // 1. Insert Receipt Header
      const { data: receiptData, error: receiptError } = await supabase
        .from('receipts')
        .insert([{
            store_name: store,
            total_amount: parseFloat(total),
            purchase_date: date,
            discord_user_id: currentUser.discord_id,
            receipt_type: category
        }])
        .select();

      if (receiptError) throw receiptError;
      const newReceiptId = receiptData[0].id;

      // 2. Insert the Item (Optional)
      if (itemName) {
        await supabase
            .from('receipt_items')
            .insert([{
                receipt_id: newReceiptId,
                name: itemName,
                price: parseFloat(total),
                quantity: 1,
                category: category
            }]);
      }

      // 3. Cleanup
      setStore('');
      setTotal('');
      setItemName('');
      setIsOpen(false);
      if (onReceiptAdded) onReceiptAdded();

    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- CLOSED STATE (The Button) ---
  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="manual-add-btn">
        <Plus size={18} />
        <span>Add Receipt</span>
      </button>
    );
  }

  // --- OPEN STATE (The Form) ---
  return (
    <div className="manual-form-card">
      <div className="manual-form-header">
        <h3>New Receipt</h3>
        <button onClick={() => setIsOpen(false)} className="close-btn">
            <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="manual-form-body">

        {/* Store */}
        <div className="input-group">
            <ShoppingBag size={16} className="input-icon" />
            <input
                type="text"
                placeholder="Store Name"
                value={store}
                onChange={(e) => setStore(e.target.value)}
                required
            />
        </div>

        {/* Item Name */}
        <div className="input-group">
            <Package size={16} className="input-icon" />
            <input
                type="text"
                placeholder="Item (Optional)"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
            />
        </div>

        {/* Amount & Date Row */}
        <div className="form-row">
            <div className="input-group">
                <DollarSign size={16} className="input-icon" />
                <input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    value={total}
                    onChange={(e) => setTotal(e.target.value)}
                    required
                />
            </div>
            <div className="input-group">
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="date-input"
                />
            </div>
        </div>

        {/* Category */}
        <div className="input-group">
            <Tag size={16} className="input-icon" />
            <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
            >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
        </div>

        <button disabled={loading} className="save-receipt-btn">
          {loading ? 'Saving...' : 'Save Receipt'}
        </button>
      </form>
    </div>
  );
}