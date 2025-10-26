import './App.css';
import {useState, useEffect, useCallback, useMemo} from 'react'
import {fetchCSV} from "./utils/helper";
import ScatterplotContainer from "./components/scatterplot/ScatterplotContainer";
import ParallelCoordinatesContainer from "./components/parallelcoordinates/ParallelCoordinatesContainer";
import AxisCountControl from "./components/axiscontrol/AxisCountControl";

function App() {
    console.log("[APP] component function call...")
    const [data,setData] = useState([])
    const [numAxes, setNumAxes] = useState(6); // State for number of axes
    const [maxAxes, setMaxAxes] = useState(13); // Maximum number of axes (will be updated based on data)
    
    // Callback functions for clearing brushes
    const [clearScatterplotBrushCallback, setClearScatterplotBrushCallback] = useState(null);
    const [clearParallelCoordinatesBrushesCallback, setClearParallelCoordinatesBrushesCallback] = useState(null);
    
    // every time the component re-render
    useEffect(()=>{
        console.log("[APP] useEffect (called each time App re-renders)");
    }); // if no dependencies, useEffect is called at each re-render

    useEffect(()=>{
        console.log("[APP] did mount");
        fetchCSV("data/Housing.csv",(response)=>{
            console.log("[APP] initial setData() ...")
            setData(response.data);
            // Update maxAxes based on data attributes (excluding 'index')
            if (response.data.length > 0) {
                const attributeCount = Object.keys(response.data[0]).filter(key => key !== 'index').length;
                setMaxAxes(attributeCount);
            }
        })
        return ()=>{
            console.log("[APP] did unmount");
        }
    },[])

    const [selectedItems, setSelectedItems] = useState([])

    // Memoize controller methods to prevent re-creation on every render
    const scatterplotControllerMethods = useMemo(() => ({
        updateSelectedItems: (items) =>{
            // For single item clicks, add to existing selection
            if (items.length === 1) {
                console.log("[APP] Selected ", items[0])
                setSelectedItems(prevSelected => {
                    const itemIndex = items[0].index;
                    // Check if item is already selected
                    const alreadySelected = prevSelected.some(item => item.index === itemIndex);
                    
                    if (alreadySelected) {
                        // Remove item if already selected (toggle behavior)
                        return prevSelected.filter(item => item.index !== itemIndex);
                    } else {
                        // Add item to selection
                        return [...prevSelected, {...items[0], selected: true}];
                    }
                });
            } else {
                // For brush selections (multiple items), replace the selection
                setSelectedItems(items.map((item) => {return {...item, selected: true}}));
            }
        },
        clearParallelCoordinatesBrushes: () => {
            if (clearParallelCoordinatesBrushesCallback) {
                clearParallelCoordinatesBrushesCallback();
            }
        }
    }), [clearParallelCoordinatesBrushesCallback]);

    const parallelCoordinatesControllerMethods = useMemo(() => ({
        updateSelectedItems: (items) => {
            // In PCP, always replace the selection
            setSelectedItems(items.map((item) => {return {...item, selected: true}}));
        },
        clearScatterplotBrush: () => {
            if (clearScatterplotBrushCallback) {
                clearScatterplotBrushCallback();
            }
        }
    }), [clearScatterplotBrushCallback]);

    // Stable callback for registering scatterplot clear brush function
    const registerScatterplotClearBrush = useCallback((callback) => {
        setClearScatterplotBrushCallback(() => callback);
    }, []);

    // Stable callback for registering parallel coordinates clear brush function
    const registerParallelCoordinatesClearBrush = useCallback((callback) => {
        setClearParallelCoordinatesBrushesCallback(() => callback);
    }, []);

    return (
        <div className="App">
            <div id={"MultiviewContainer"} className={"row"}>
                <ScatterplotContainer 
                    scatterplotData={data}
                    xAttribute={"area"} yAttribute={"price"}
                    selectedItems={selectedItems}
                    scatterplotControllerMethods={scatterplotControllerMethods}
                    onClearBrushRequested={registerScatterplotClearBrush}
                />
                
                <ParallelCoordinatesContainer
                    parallelCoordinatesData={data}
                    selectedItems={selectedItems}
                    parallelCoordinatesControllerMethods={parallelCoordinatesControllerMethods}
                    numAxes={numAxes}
                    onClearBrushRequested={registerParallelCoordinatesClearBrush}
                />
            </div>
            <AxisCountControl 
                numAxes={numAxes}
                maxAxes={maxAxes}
                onAxisCountChange={setNumAxes}
            />
        </div>
    );
}

export default App;
