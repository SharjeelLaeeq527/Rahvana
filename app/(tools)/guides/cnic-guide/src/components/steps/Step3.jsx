import React, { useState, useEffect } from 'react';
import { useWizard } from '../../context/WizardContext';
import locationsData from '../../data/locations.json';

export default function Step3() {
  const { state, setLocation, setCurrentStep } = useWizard();
  const [selectedProvince, setSelectedProvince] = useState(state.location.province || '');
  const [selectedDistrict, setSelectedDistrict] = useState(state.location.district || '');
  const [selectedCity, setSelectedCity] = useState(state.location.city || '');

  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);

  useEffect(() => {
    if (selectedProvince) {
      const province = locationsData.provinces.find((p) => p.id === selectedProvince);
      setAvailableDistricts(province?.districts || []);
      setSelectedDistrict('');
      setSelectedCity('');
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedDistrict) {
      const province = locationsData.provinces.find((p) => p.id === selectedProvince);
      const district = province?.districts.find((d) => d.id === selectedDistrict);
      setAvailableCities(district?.cities || []);
      setSelectedCity('');
    }
  }, [selectedDistrict, selectedProvince]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocation({
      province: selectedProvince,
      district: selectedDistrict,
      city: selectedCity,
    });
    setTimeout(() => setCurrentStep(4), 300);
  };

  const handleBack = () => {
    setCurrentStep(2);
  };

  const isFormValid = selectedProvince && selectedDistrict && selectedCity;

  return (
    <div className="max-w-2xl mx-auto animate-slide-in">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Location Information
        </h2>
        <p className="text-gray-600 text-lg">
          Your Union Council is determined by your location at the time of birth.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country
          </label>
          <input
            type="text"
            value="Pakistan"
            disabled
            className="input bg-gray-50 text-gray-500 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">
            This wizard is specifically for Pakistan birth certificates.
          </p>
        </div>

        {/* Province */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Province / Territory <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            className="input"
            required
          >
            <option value="">Select Province / Territory</option>
            {locationsData.provinces.map((province) => (
              <option key={province.id} value={province.id}>
                {province.name}
              </option>
            ))}
          </select>
        </div>

        {/* District */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            District <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="input"
            disabled={!selectedProvince}
            required
          >
            <option value="">
              {selectedProvince ? 'Select District' : 'Select Province First'}
            </option>
            {availableDistricts.map((district) => (
              <option key={district.id} value={district.id}>
                {district.name}
              </option>
            ))}
          </select>
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City / Area <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="input"
            disabled={!selectedDistrict}
            required
          >
            <option value="">
              {selectedDistrict ? 'Select City / Area' : 'Select District First'}
            </option>
            {availableCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <span className="font-medium">Why location matters:</span> Union Councils have
            jurisdiction based on geographic boundaries. The birth certificate must be
            obtained from the Union Council where the birth occurred. For US immigration,
            ensure your certificate is from the correct jurisdiction to avoid delays.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-4">
          <button type="button" onClick={handleBack} className="btn btn-secondary">
            ← Back
          </button>
          <div className="text-sm text-gray-500">Step 3 of 7</div>
          <button type="submit" disabled={!isFormValid} className="btn btn-primary">
            Continue →
          </button>
        </div>
      </form>
    </div>
  );
}
