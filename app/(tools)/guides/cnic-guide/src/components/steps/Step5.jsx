import React, { useState, useEffect } from 'react';
import { useWizard } from '../../context/WizardContext';
import { SearchIcon, MapIcon, ClockIcon, StarIcon, AlertIcon } from '../Icons';
import officesData from '../../data/offices.json';

export default function Step5() {
  const { state, setPreferredOffice, setCurrentStep } = useWizard();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOffices, setFilteredOffices] = useState([]);

  useEffect(() => {
    // Filter offices based on user location
    let offices = officesData.offices;

    if (state.location.province) {
      offices = offices.filter((office) => office.province === state.location.province);
    }

    if (state.location.district) {
      offices = offices.filter((office) => office.district === state.location.district);
    }

    if (state.location.city) {
      offices = offices.filter((office) => office.city === state.location.city);
    }

    // Apply search filter
    if (searchQuery) {
      offices = offices.filter(
        (office) =>
          office.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          office.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          office.city.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredOffices(offices);
  }, [state.location, searchQuery]);

  const handleBack = () => {
    setCurrentStep(4);
  };

  const handleContinue = () => {
    setCurrentStep(6);
  };

  const handleSaveOffice = (office) => {
    setPreferredOffice(office);
  };

  return (
    <div className="max-w-4xl mx-auto animate-slide-in space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Find Your Union Council Office</h2>
        <p className="text-gray-600 text-lg">
          Based on your location: {state.location.city}, {state.location.district}
        </p>
      </div>

      {/* Jurisdiction Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900">
            <p className="font-medium mb-1">Important: Jurisdiction Matters</p>
            <p>
              Birth certificates must be obtained from the Union Council with jurisdiction over
              your place of birth. Verify that the office below has jurisdiction for your specific
              location. Office listings and contact information may change; always confirm details
              before visiting.
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by office name, address, or area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-12"
          />
        </div>
      </div>

      {/* Office Listings */}
      <div className="space-y-4">
        {filteredOffices.length === 0 ? (
          <div className="card text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <SearchIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No offices found</h3>
            <p className="text-gray-600">
              Try adjusting your search or check your location settings.
            </p>
          </div>
        ) : (
          filteredOffices.map((office) => (
            <div key={office.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{office.name}</h3>
                    {office.nadraConnected && (
                      <span className="badge badge-success">NADRA Connected</span>
                    )}
                    {state.preferredOffice?.id === office.id && (
                      <span className="badge bg-primary-100 text-primary-700">Saved</span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-3">{office.address}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <ClockIcon className="w-4 h-4 text-gray-400" />
                      <span>{office.hours}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      <span>{office.phone}</span>
                    </div>
                  </div>

                  {office.notes && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-900">{office.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <a
                  href={office.mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline flex-1 flex items-center justify-center gap-2"
                >
                  <MapIcon className="w-5 h-5" />
                  View on Map
                </a>
                <button
                  onClick={() => handleSaveOffice(office)}
                  disabled={state.preferredOffice?.id === office.id}
                  className={`btn flex-1 flex items-center justify-center gap-2 ${
                    state.preferredOffice?.id === office.id
                      ? 'btn-secondary'
                      : 'btn-primary'
                  }`}
                >
                  <StarIcon
                    className="w-5 h-5"
                    filled={state.preferredOffice?.id === office.id}
                  />
                  {state.preferredOffice?.id === office.id ? 'Saved' : 'Save Office'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button onClick={handleBack} className="btn btn-secondary">
          ← Back
        </button>
        <div className="text-sm text-gray-500">Step 5 of 7</div>
        <button onClick={handleContinue} className="btn btn-primary">
          Continue →
        </button>
      </div>
    </div>
  );
}
