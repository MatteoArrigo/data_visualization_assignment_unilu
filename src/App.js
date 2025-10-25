import './App.css';
import {useState, useEffect, useRef} from 'react'
import {fetchCSV} from "./utils/helper";
import ScatterplotContainer from "./components/scatterplot/ScatterplotContainer";
import ParallelCoordinatesContainer from "./components/parallelcoordinates/ParallelCoordinatesContainer";
import AxisCountControl from "./components/axiscontrol/AxisCountControl";

function App() {
    console.log("App component function call...")
    const [data,setData] = useState([])
    const [numAxes, setNumAxes] = useState(6); // State for number of axes
    const [maxAxes, setMaxAxes] = useState(13); // Maximum number of axes (will be updated based on data)
    
    // Refs for the visualization components
    const scatterplotRef = useRef(null);
    const parallelCoordinatesRef = useRef(null);
    
    // every time the component re-render
    useEffect(()=>{
        console.log("App useEffect (called each time App re-renders)");
    }); // if no dependencies, useEffect is called at each re-render

    useEffect(()=>{
        console.log("App did mount");
        fetchCSV("data/Housing.csv",(response)=>{
            console.log("initial setData() ...")
            setData(response.data);
            // Update maxAxes based on data attributes (excluding 'index')
            if (response.data.length > 0) {
                const attributeCount = Object.keys(response.data[0]).filter(key => key !== 'index').length;
                setMaxAxes(attributeCount);
            }
        })
        return ()=>{
            console.log("App did unmount");
        }
    },[])

    const [selectedItems, setSelectedItems] = useState([])

    const scatterplotControllerMethods= {
        updateSelectedItems: (items) =>{
            // For single item clicks, add to existing selection
            if (items.length === 1) {
                console.log("[DEBUG] Selected ", items[0])
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
            if (parallelCoordinatesRef.current) {
                parallelCoordinatesRef.current.clearAllBrushes();
            }
        }
    };

    const parallelCoordinatesControllerMethods= {
        updateSelectedItems: (items) =>{
            // For single item clicks, add to existing selection
            if (items.length === 1) {
                console.log("[DEBUG] Selected ", items[0])

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
        clearScatterplotBrush: () => {
            if (scatterplotRef.current) {
                scatterplotRef.current.clearBrush();
            }
        }
    };

    return (
        <div className="App">
            <div id={"MultiviewContainer"} className={"row"}>
                <ScatterplotContainer 
                    ref={scatterplotRef}
                    scatterplotData={data}
                    xAttribute={"area"} yAttribute={"price"}
                    selectedItems={selectedItems}
                    scatterplotControllerMethods={scatterplotControllerMethods}
                />
                <ParallelCoordinatesContainer
                    ref={parallelCoordinatesRef}
                    parallelCoordinatesData={data}
                    selectedItems={selectedItems}
                    parallelCoordinatesControllerMethods={parallelCoordinatesControllerMethods}
                    numAxes={numAxes}
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
