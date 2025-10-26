import './Scatterplot.css'
import {useEffect, useRef} from 'react';

import ScatterplotD3 from './Scatterplot-d3';

const ScatterplotContainer = ({scatterplotData, xAttribute, yAttribute, selectedItems, scatterplotControllerMethods, clearBrushRef}) => {

    // every time the component re-render
    useEffect(()=>{
        console.log("[SCATTERPLOT CONTAINER] useEffect (called each time scatterplot re-renders)");
    }); // if no dependencies, useEffect is called at each re-render

    const divContainerRef = useRef(null);
    const scatterplotD3Ref = useRef(null);
    const scatterplotDataRef = useRef(scatterplotData);

    const getChartSize = function(){
        // getting size from parent item
        let width;
        let height;
        if(divContainerRef.current!==undefined){
            width=divContainerRef.current.offsetWidth;
            height=divContainerRef.current.offsetHeight-4;
        }
        return {width:width,height:height};
    }

    // Initial setup, called only once the component did mount
    // Creates reference for scatterplotD3
    useEffect(()=>{
        console.log("[SCATTERPLOT CONTAINER] (component did mount) creation of ScatterplotD3 instance...");
        const scatterplotD3 = new ScatterplotD3(divContainerRef.current);
        scatterplotD3.create({size:getChartSize()});
        scatterplotD3Ref.current = scatterplotD3;
        
        // Expose clearBrush method via ref
        clearBrushRef.current = () => {
            if (scatterplotD3Ref.current) {
                scatterplotD3Ref.current.clearBrush();
            }
        };
        
        return ()=>{
            // did unmount, the return function is called once the component did unmount (removed for the screen)
            console.log("[SCATTERPLOT CONTAINER] useEffect [] return function, called when the component did unmount...");
            const scatterplotD3 = scatterplotD3Ref.current;
            scatterplotD3.clear()
            clearBrushRef.current = null;
        }
    },[clearBrushRef]);

    // Update scatterplot when data or attributes change
    useEffect(()=>{
        console.log("[SCATTERPLOT CONTAINER] update scatterplot when data or attributes change...");

        const handleOnClick = function(itemData){
            console.log("[SCATTERPLOT CONTAINER] handleOnClick ...")
            scatterplotControllerMethods.updateSelectedItems([itemData])
        }
        const handleOnMouseEnter = function(itemData){}
        const handleOnMouseLeave = function(){}
        const handleBrushSelection = function(selectedItems){
            console.log("[SCATTERPLOT CONTAINER] handleBrushSelection with", selectedItems.length, "items")
            scatterplotControllerMethods.updateSelectedItems(selectedItems)
        }
        const clearOtherBrushes = function(){
            console.log("[SCATTERPLOT CONTAINER] clearOtherBrushes called from scatterplot")
            if (scatterplotControllerMethods.clearParallelCoordinatesBrushes) {
                scatterplotControllerMethods.clearParallelCoordinatesBrushes();
            }
        }

        const controllerMethods = {
            handleOnClick,
            handleOnMouseEnter,
            handleOnMouseLeave,
            handleBrushSelection,
            clearOtherBrushes
        };
        if(scatterplotDataRef.current !== scatterplotData) {
            // Re-render scatterplot only if data actually changed
            console.log("[SCATTERPLOT CONTAINER] useEffect with dependency when scatterplotData changes...");
            const scatterplotD3 = scatterplotD3Ref.current
            scatterplotD3.renderScatterplot(scatterplotData, xAttribute, yAttribute, controllerMethods);
            scatterplotDataRef.current = scatterplotData;
        }
    },[scatterplotData, xAttribute, yAttribute, scatterplotControllerMethods]);


    // Update highlighted items when selectedItems changes
    useEffect(()=>{
        console.log("[SCATTERPLOT CONTAINER] update highlighted items when selectedItems changes...");
        const scatterplotD3 = scatterplotD3Ref.current
        scatterplotD3.highlightSelectedItems(selectedItems)
    },[selectedItems])


    return(
        <div ref={divContainerRef} className="scatterplotDivContainer col-40">
        </div>
    )
};

export default ScatterplotContainer;