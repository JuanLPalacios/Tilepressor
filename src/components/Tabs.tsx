import React, { useState, useEffect, useRef } from 'react';
import { Size, SizeContext } from '../contexts/Size';
/**/
export const innerText = (node:React.ReactNode|string):string=>{
    if(typeof node != 'object')
        return ''+node;
    if(React.isValidElement(node)){
        return (([node?.props.children]||[]).flat()).map(innerText)
            .join('');
    }
    return '';
};
/**/
export const Tabs = ({ tapsPosition='top', active, onActiveChange, children, width=100, height=100 }:{ tapsPosition?:'top'|'left'|'right'|'bottom', active?:number, onActiveChange?:(e:{active:number})=>never|void, children:(React.ReactElement|React.ReactElement[])[] }&Partial<Size>) => {
    const [activeTab, setActiveTab] = useState(0);
    const tabBarRef = useRef<HTMLDivElement>();
    const [size, setSize] = useState({ width: width-32, height: height-32 });
    const tabs = children.flat();
    //manually set active tab
    useEffect(()=>{
        if(active!==undefined){
            setActiveTab(active);
        }
    }, [active]);
    //tab label click event handler
    const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, newActiveTab: number) => {
        e.preventDefault();
        if(newActiveTab != activeTab){
            setActiveTab(newActiveTab);
            if(onActiveChange)onActiveChange({ active: newActiveTab });
        }
    };
    React.useEffect(() => {
        if (tabBarRef.current) {
            if(['top', 'bottom'].includes(tapsPosition))
                setSize({ width: width-32, height: height-32-tabBarRef.current.clientHeight });
            else
                setSize({ width: width-32-tabBarRef.current.clientWidth, height: height-32 });
        }
    }, [height, width, tabs.length, tabBarRef.current?.clientHeight, tabBarRef.current?.clientWidth]);
    return (
        <div style={{ width: `${width}px`, height: `${height}px` }} className={`flex ${{ top: 'flex-col', bottom: 'flex-col-reverse', left: 'flex-row', right: 'flex-row-reverse' }[tapsPosition]}`}>
            <div ref={tabBarRef as never} className={`flex  flex-wrap ${{ top: 'border-b', bottom: 'border-t', left: 'border-r', right: 'border-l' }[tapsPosition]} border-primary-200 ${{ top: 'flex-row', bottom: 'flex-row', left: 'flex-col', right: 'flex-col' }[tapsPosition]}`}>
                {tabs.map((child, i) => (
                    <button
                        key={`${i}-${innerText(child.props.label)}`}
                        title={child.props.tip||innerText(child.props.label)}
                        className={`${
                            activeTab === i ? `bg-primary-50 ${{ top: 'border-2 border-b-0 rounded-t', bottom: 'border-2 border-t-0 rounded-b', left: 'border-2 border-r-0 rounded-l', right: 'border-2 border-l-0 rounded-r' }[tapsPosition]} border-primary-300` : `${{ top: 'border-b-2', bottom: 'border-t-2', left: 'border-r-2', right: 'border-l-2' }[tapsPosition]} border-primary-300`
                        }  flex-1 font-medium py-2`}
                        onClick={e => handleClick(e, i)}
                        disabled={child.props.disabled}
                    >
                        {child.props.label}
                    </button>
                ))}
            </div>
            <div className="p-4"  style={{ width: `${size.width+32}px`, height: `${size.height+32}px` }}>
                <SizeContext.Provider value={size}>
                    {tabs.map((child, i) => {
                        if (i === activeTab) {
                            return child;
                        }
                        return null;
                    })}
                </SizeContext.Provider>
            </div>
        </div>
    );
};

