import React, { useState } from 'react';
import { 
    useGetCitiesQuery, 
    useGetCountriesQuery, 
    useGetStatesQuery 
} from '../../redux/api/common/countryStateCitySlice';


const CountryStateCityDropdown = () => {
    const [selectedCountry, setSelectedCountry] = useState<number | null>(null);
    const [selectedState, setSelectedState] = useState<number | null>(null);

    // Fetch countries
    const { data: countries } = useGetCountriesQuery({});

    // Fetch states based on selected country
    const { data: states = [] } = useGetStatesQuery(selectedCountry, {
        skip: selectedCountry === null, // Skip if no country is selected
    });

    // Fetch cities based on selected state
    const { data: cities = [] } = useGetCitiesQuery(selectedState, {
        skip: selectedState === null, // Skip if no state is selected
    });

    const handleCountryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedCountry(Number(event.target.value));
        setSelectedState(null); // Reset state and city when country changes
    };

    const handleStateChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        alert(event.target.value)
        setSelectedState(Number(event.target.value));
    };

    return (
        <div>
            <div>
                <label>Country</label>
                <select value={selectedCountry || ''} onChange={handleCountryChange}>
                    <option value="">Select Country</option>
                    {countries?.data?.countries?.map((country: any) => (
                        <option key={country.id} value={country.id}>{country.countryName}</option>
                    ))}
                </select>
            </div>
            <div>
                <label>State</label>
                <select value={selectedState || ''} onChange={handleStateChange} disabled={!selectedCountry}>
                    <option value="">Select State</option>
                    {states?.data?.states?.map((state: any) => (
                        <option key={state.id} value={state.id}>{state.name}</option>
                    ))}
                </select>
            </div>
            <div>
                <label>City</label>
                <select value={selectedState ? selectedState : ''} disabled={!selectedState}>
                    <option value="">Select City</option>
                    {cities?.data?.cities?.map((city: any) => (
                        <option key={city.id} value={city.id}>{city.name}</option>
                    ))}
                </select>
            </div>

        </div>
    );
};

export default CountryStateCityDropdown;