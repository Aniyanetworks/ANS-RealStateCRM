import Select from 'react-select';
// import { BrokerageDisplay } from './BrokerageDisplay';


interface Brokerage {
    id: number;
    address: string;
    streetAddress: string;
    state: {
        name: string;
    };
    city: {
        name: string;
    };
    postalZipCode: string;
    phoneNumber: string;
    faxNumber: string;
}

interface BrokerageSelectorProps {
    label: string;
    options: Brokerage[];
    selectedBrokerage: Brokerage | null;
    onSelect: (option: Brokerage) => void;
    onCreateClick: () => void;
}

export const BrokerageSelector = ({
    label,
    options,
    selectedBrokerage,
    onSelect,
    onCreateClick,
}: BrokerageSelectorProps) => {
    // console.log('selectedBrokerage',selectedBrokerage);
    return (
        <div className="flex flex-col gap-2">
            <label>
                {label} <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="flex items-center">
                <Select
                    options={options}
                    value={options.find(
                        (option) => option.address === selectedBrokerage?.address
                    )}
                    onChange={(option) => onSelect(option as Brokerage)}
                    className="flex-grow"
                    isClearable
                />
                <button
                    type="button"
                    onClick={onCreateClick}
                    className="ml-2 p-2 bg-blue-500 text-white rounded"
                >
                    +
                </button>
            </div>
            {/* {selectedBrokerage && (
                <BrokerageDisplay brokerage={selectedBrokerage} />
            )} */}
        </div>
    );
}; 