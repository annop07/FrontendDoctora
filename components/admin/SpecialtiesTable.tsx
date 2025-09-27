'use client';

import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

interface Specialty {
  id: number;
  name: string;
  description: string;
  doctorCount: number;
}

interface SpecialtiesTableProps {
  specialties: Specialty[];
  onEdit: (specialty: Specialty) => void;
  onDelete: (specialtyId: number) => void;
}

const SpecialtiesTable: React.FC<SpecialtiesTableProps> = ({
  specialties,
  onEdit,
  onDelete
}) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium">Specialties Management</h2>
        <p className="text-sm text-gray-500">Manage medical specialties</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialty Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctors Count</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {specialties.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  No specialties found
                </td>
              </tr>
            ) : (
              specialties.map((specialty) => (
                <tr key={specialty.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{specialty.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">{specialty.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {specialty.doctorCount} doctors
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => onEdit(specialty)}
                      className="text-blue-600 hover:text-blue-900 mr-3" 
                      title="Edit"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onDelete(specialty.id)}
                      className={`${
                        specialty.doctorCount > 0 
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-red-600 hover:text-red-900'
                      }`}
                      disabled={specialty.doctorCount > 0}
                      title={specialty.doctorCount > 0 ? 'Cannot delete - has doctors' : 'Delete'}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SpecialtiesTable;