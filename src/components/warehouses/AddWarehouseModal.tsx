import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { warehouseService } from '../../services/warehouseService';
import { Warehouse } from '../../types/warehouse';
import { Building2, MapPin, Phone, User, Hash, AlertCircle } from 'lucide-react';

interface AddWarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (warehouse: Warehouse) => void;
}

export const AddWarehouseModal: React.FC<AddWarehouseModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [stateCode, setStateCode] = useState('27');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [capacity, setCapacity] = useState('50000');
  const [isPrimary, setIsPrimary] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !code.trim() || !city.trim()) {
      setError('Warehouse Name, Facility Code, and City are required.');
      return;
    }

    setIsLoading(true);
    try {
      const created = await warehouseService.createWarehouse({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        state: state.trim(),
        stateCode: stateCode.trim(),
        city: city.trim(),
        address: address.trim() || `${city}, ${state}`,
        pincode: pincode.trim() || '400001',
        contactPerson: contactPerson.trim() || 'Operations Lead',
        phone: phone.trim() || '+91 98000 00000',
        totalCapacitySqFt: parseInt(capacity, 10) || 50000,
        isPrimary,
      });

      onCreated(created);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create warehouse.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure New Warehouse Facility" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Facility / Warehouse Name *"
            type="text"
            placeholder="e.g. Bhiwandi Central Depot"
            leftIcon={<Building2 className="w-4 h-4" />}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Facility Code *"
            type="text"
            placeholder="e.g. WH-BHW-01"
            leftIcon={<Hash className="w-4 h-4" />}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="City *"
            type="text"
            placeholder="e.g. Mumbai"
            leftIcon={<MapPin className="w-4 h-4" />}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              State
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#12151D] text-slate-800 dark:text-white"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
          </div>

          <Input
            label="Pincode"
            type="text"
            placeholder="421302"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
          />
        </div>

        <Input
          label="Detailed Physical Address"
          type="text"
          placeholder="Plot No., Industrial Area, Highway / Road"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Facility Manager"
            type="text"
            placeholder="Contact person name"
            leftIcon={<User className="w-4 h-4" />}
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
          />

          <Input
            label="Contact Phone"
            type="tel"
            placeholder="+91 98000 00000"
            leftIcon={<Phone className="w-4 h-4" />}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <Input
            label="Total Capacity (Sq. Ft.)"
            type="number"
            placeholder="50000"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
        </div>

        <div className="pt-2">
          <label className="flex items-center gap-2 text-xs cursor-pointer text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="rounded border-slate-300 text-brand-orange focus:ring-brand-orange accent-[#FF6B35]"
            />
            <span>Set as primary operational facility</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
          <Button variant="secondary" size="md" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" size="md" type="submit" isLoading={isLoading}>
            Save Facility
          </Button>
        </div>
      </form>
    </Modal>
  );
};
