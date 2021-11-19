////////////////////////////////////////////////////////////////////////
// Pie.ts
// By Don Hopkins.


////////////////////////////////////////////////////////////////////////
// Notes:
//
// Rename properties and methods to not be so mouse-centric.
//     MouseButton => Pressed
//     MousePosition => Position
//
// Multiple buttons.
//
// Multi-touch.
//
// Keyboard navigation.
//
// Canvas background, overlay.
//
// DOM overlays for pies, slices, items, and cursor.
//
// Opening, closing, tracking, and selecting animations.
//
// Send low level PressedDownUI and PressedUpUI events so the
// client has a chance to inhibit pie menu tracking until after the
// next mouse button up event, by setting isPointerOverUIObject = true.
//
// Hover and Drift notification over pies, slices, and items.
// Continuous tracking notification even if the mouse doesn't move.
//
// Plugin slice tracking and drawing for different slices types:
// PullOut, DropDown, DropOut, PieOut, etc.
//
// Document StartPie's protocol for figuring out and initializing
// which pie to use.
//
// Events:
//   Tracker:
//     MouseDown=>PressedDown MouseMove=>PressedMove MouseUp=>PressedUp
//     DragStart MouseDrag=>DragMove DragStop
//     MouseOver=>UnpressedMove, UnpressedStay
//     Hover Drift
//   PieTracker:
//     PressedDownUI PressedUpUI
//     PressedDown PressedUp PressedChanged PositionChanged 


////////////////////////////////////////////////////////////////////////
// Imports.


////////////////////////////////////////////////////////////////////////
// Interfaces.


export interface PieHandler {
    (pie: Pie, target: any): void;
}


export interface PieSliceHandler {
    (slice: Slice, pie: Pie, target: any): void;
}


export interface PieSliceIndexHandler {
    (sliceIndex: number, pie: Pie, target: any): void;
}


export interface PieItemHandler {
    (item: Item, slice: Slice, pie: Pie, target: any): void;
}


export interface PieItemIndexHandler {
    (itemIndex: number, slice: Slice, pie: Pie, target: any): void;
}


export interface PieListener {

    handleStartPie(pie: Pie, target: any): void; // PieHandler
    handleTrackPie(pie: Pie, target: any): void; // PieHandler
    handleStopPie(pie: Pie, target: any): void; // PieHandler
    handleCancelPie(pie: Pie, target: any): void; // PieHandler

    handleConstructPie(pie: Pie, target: any): void; // PieHandler
    handleDeconstructPie(pie: Pie, target: any): void; // PieHandler

    handleLayoutPie(pie: Pie, target: any): void; // PieHandler

    handleShowPie(pie: Pie, target: any): void; // PieHandler
    handleHidePie(pie: Pie, target: any): void; // PieHandler

    handlePressPie(pie: Pie, target: any): void; // PieHandler
    handleReleasePie(pie: Pie, target: any): void; // PieHandler
    handleSelectPie(pie: Pie, target: any): void; // PieHandler

    handleEnterPieCenter(pie: Pie, target: any): void; // PieHandler
    handleTrackPieCenter(pie: Pie, target: any): void; // PieHandler
    handleExitPieCenter(pie: Pie, target: any): void; // PieHandler
    handlePressPieCenter(pie: Pie, target: any): void; // PieHandler
    handleReleasePieCenter(pie: Pie, target: any): void; // PieHandler
    handleSelectPieCenter(pie: Pie, target: any): void; // PieHandler

    handleEnterSlice(slice: Slice, pie: Pie, target: any): void; // PieSliceHandler
    handleTrackSlice(slice: Slice, pie: Pie, target: any): void; // PieSliceHandler
    handleExitSlice(slice: Slice, pie: Pie, target: any): void; // PieSliceHandler
    handlePressSlice(slice: Slice, pie: Pie, target: any): void; // PieSliceHandler
    handleReleaseSlice(slice: Slice, pie: Pie, target: any): void; // PieSliceHandler
    handleSelectSlice(slice: Slice, pie: Pie, target: any): void; // PieSliceHandler

    handleEnterEmptySlice(sliceIndex: number, pie: Pie, target: any): void; // PieSliceIndexHandler
    handleTrackEmptySlice(sliceIndex: number, pie: Pie, target: any): void; // PieSliceIndexHandler
    handleExitEmptySlice(sliceIndex: number, pie: Pie, target: any): void; // PieSliceIndexHandler
    handlePressEmptySlice(sliceIndex: number, pie: Pie, target: any): void; // PieSliceIndexHandler
    handleReleaseEmptySlice(sliceIndex: number, pie: Pie, target: any): void; // PieSliceIndexHandler
    handleSelectEmptySlice(sliceIndex: number, pie: Pie, target: any): void; // PieSliceIndexHandler

    handleEnterItem(item: Item, slice: Slice, pie: Pie, target: any): void; // PieItemHandler
    handleTrackItem(item: Item, slice: Slice, pie: Pie, target: any): void; // PieItemHandler
    handleExitItem(item: Item, slice: Slice, pie: Pie, target: any): void; // PieItemHandler
    handlePressItem(item: Item, slice: Slice, pie: Pie, target: any): void; // PieItemHandler
    handleReleaseItem(item: Item, slice: Slice, pie: Pie, target: any): void; // PieItemHandler
    handleSelectItem(item: Item, slice: Slice, pie: Pie, target: any): void; // PieItemHandler

    handleEnterEmptyItem(itemIndex: number, slice: Slice, pie: Pie, target: any): void; // PieItemIndexHandler
    handleTrackEmptyItem(itemIndex: number, slice: Slice, pie: Pie, target: any): void; // PieItemIndexHandler
    handleExitEmptyItem(itemIndex: number, slice: Slice, pie: Pie, target: any): void; // PieItemIndexHandler
    handlePressEmptyItem(itemIndex: number, slice: Slice, pie: Pie, target: any): void; // PieItemIndexHandler
    handleReleaseEmptyItem(itemIndex: number, slice: Slice, pie: Pie, target: any): void; // PieItemIndexHandler
    handleSelectEmptyItem(itemIndex: number, slice: Slice, pie: Pie, target: any): void; // PieItemIndexHandler

}


////////////////////////////////////////////////////////////////////////
// Pie class definition.


export class PieTracker {

    tracking: boolean = false;
    trackingPressed: boolean = false;
    pressed: boolean = false;
    pressedLast: boolean = false;
    pressedChanged: boolean = true;
    pressedDownTime: number = -1;
    ignoringClick: boolean = false;
    trackingPosition: boolean = false;
    trackingPositionHoverDelay: number = 0.1;
    trackingPositionDriftDelay: number = 0.1;
    trackingPositionHovering: boolean = false;
    trackingPositionHoverTime: number = -1;
    trackingPositionDriftTime: number = -1;
    position: any = { x: 0, y: 0 };
    positionStart: any = { x: 0, y: 0 };
    positionLast: any = { x: 0, y: 0 };
    positionDelta: any = { x: 0, y: 0 };
    screenSize: any = { width: 0, height: 0 };
    shiftKey: boolean = false;
    controlKey: boolean = false;
    altKey: boolean = false;
    distance: number = 0;
    direction: number = 0;
    justSelected: boolean = false;
    pie: Pie | null = null;
    target: any = null;

}


export class Pie {

    sliceIndex: number = -1;
    itemIndex: number = -1;
    sliceCount: number = 8;
    initialDirection: number = 0.5 * Math.PI;
    subtend: number = 0.0;
    clockwise: boolean = true;
    inactiveDistance: number = 30.0;
    itemDistance: number = 30.0;
    pinned: boolean = false;
    pinToCursor: boolean = true;


    trackMouseDown(down: boolean) {
    }


    startPie(position: any, pieID: string, target: any, pinned: boolean) {
    }


    stopPie() {
    }


    cancelPie() {
    }


    constructPie(pie: Pie) {
    }


    deconstructPie(pie: Pie) {
    }


    updatePie(pie: Pie) {
    }


    layoutPie(pie: Pie) {
    }


    showPie(position: any) {
    }


    movePie(pie: Pie, position: any) {
    }


    hidePie() {
    }


    trackPie(position: any, distance: number, direction: number, nextSliceIndex: number, nextItemIndex: number, reset: boolean) {
    }


    pieDistance(pie: Pie, scale: number, plateau: number): number {
        return 0
    }


    ////////////////////////////////////////////////////////////////////////
    // Events


    sendEventName(name: string) {
    }


    ////////////////////////////////////////////////////////////////////////
    // Utilities


    // searchDefault searches a list of dictionaries for
    // a key, the its value in the first dictionary that
    // contains it, or returns a default value if it's
    // not found. The first argument is the key, the next
    // one or more arguments are the dictionaries to search,
    // and the last argument is the default value.
    // So there must be at least three arguments.
    searchDefault(...args: any): any {
        //console.log("searchDefault: key:", arguments[0], "arguments:", arguments);

        const argCount = args.length;

        if (argCount < 3) {
            console.log("searchDefault: Called with nonsensically too few args! Should be: key, object..., default", args);
            return null;
        }

        // The first arg is the key to search for.
        const key = args[0];

        // Search the rest of args for the key, except for the last one.
        // The last arg is the default value so don't search that one.

        for (let argIndex = 1;
            argIndex < (argCount - 1);
            argIndex++) {

            const dict = args[argIndex];

            // Skip null dicts, for convenience.
            if (!dict) {
                continue;
            }

            const value = dict[key];

            if (value !== undefined) {
                // Found it!
                return value;
            }

        }

        // Didn't find it, so return the default.
        return args[argCount - 1];
    }


    makeParameterSlice(label: string, name: string, calculator: (pie: Pie) => any, updater: (target: any, val: any) => void): any {
        return null;
    }


    callHandler(name: string, ...args: any[]) {
        const handler = this.searchDefault.apply(this, [name, ...args]);
        handler.apply(null, args);
    }


};


////////////////////////////////////////////////////////////////////////
// Slice class definition.


export class Slice {
};


////////////////////////////////////////////////////////////////////////
// Item class definition.


export class Item {
};


////////////////////////////////////////////////////////////////////////
