import React, { useState } from 'react';
import './AxisCountControl.css';

function AxisCountControl({ numAxes, maxAxes, onAxisCountChange }) {
    const [inputValue, setInputValue] = useState(numAxes);

    const handleChange = (event) => {
        const value = event.target.value;
        setInputValue(value);
        
        const newCount = parseInt(value);
        if (!isNaN(newCount) && newCount >= 2 && newCount <= maxAxes) {
            onAxisCountChange(newCount);
        }
    };

    const handleBlur = () => {
        // On blur, ensure the value is valid
        const newCount = parseInt(inputValue);
        if (isNaN(newCount) || newCount < 2 || newCount > maxAxes) {
            setInputValue(numAxes);
        }
    };

    // Update local state when prop changes
    React.useEffect(() => {
        setInputValue(numAxes);
    }, [numAxes]);

    return (
        <div className="axis-count-control">
            <label htmlFor="axes-count-input">Number of axes: </label>
            <input
                id="axes-count-input"
                type="number"
                className="axes-count-input"
                min={2}
                max={maxAxes}
                value={inputValue}
                onChange={handleChange}
                onBlur={handleBlur}
            />
        </div>
    );
}

export default AxisCountControl;
