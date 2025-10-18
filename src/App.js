import './App.css';
import {useState, useEffect} from 'react'
import {fetchCSV} from "./utils/helper";
import ScatterplotContainer from "./components/scatterplot/ScatterplotContainer";
import ParallelCoordinatesContainer from "./components/parallelcoordinates/ParallelCoordinatesContainer";

function App() {
    console.log("App component function call...")
    const [data,setData] = useState([])
    // every time the component re-render
    useEffect(()=>{
        console.log("App useEffect (called each time App re-renders)");
    }); // if no dependencies, useEffect is called at each re-render

    useEffect(()=>{
        console.log("App did mount");
        fetchCSV("data/Housing.csv",(response)=>{
            console.log("initial setData() ...")
            setData(response.data);
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
        }
    };

    const parallelCoordinatesControllerMethods= {
        updateSelectedItems: (items) =>{
            // For single item clicks, add to existing selection
            if (items.length === 1) {
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
        }
    };

    return (
        <div className="App">
            <div id={"MultiviewContainer"} className={"row"}>
                <ScatterplotContainer scatterplotData={data}
                    xAttribute={"area"} yAttribute={"price"}
                    selectedItems={selectedItems}
                    scatterplotControllerMethods={scatterplotControllerMethods}
                />
                <ParallelCoordinatesContainer 
                    parallelCoordinatesData={data}
                    selectedItems={selectedItems}
                    parallelCoordinatesControllerMethods={parallelCoordinatesControllerMethods}
                />
            </div>
        </div>
    );
}

export default App;
