export type bspNode<T> =  {
    divider:[T, T]
    front:T
    back:T
    inFront:bspNode<T>
    inBack:bspNode<T>
} | null

export function calculateDivider<T>(a:T, b:T){
    return <[T, T]>[a, b];
}

export function isFront(c:number[], [a, b]:[a:number[], b:number[]]){
    const result = Array.from(c).fill(0);
    for (let i = 0; i < a.length; i++) {
        const va = a[i];
        const vb = b[i];
        const vc = c[i];
        result[i] += (vc*(va-vb) +.5*(vb*vb - va*va))/2;
    }
    return result.reduce((prev, curr)=> prev+curr, 0) > 0;
}

export function generateBsptFromPoints<T>(points:T[], calculateDivider:(a:T, b:T)=>[a:T, b:T], isFront:(point:T, divider:[T, T])=>boolean, update?:(progress:number)=>void):bspNode<T>{
    if(points.length <= 1) return null;
    if(points.length > 256) return null;
    let minDifference = Number.MAX_VALUE;
    let inFrontOfBestDivider:T[] = [];
    let inBackOfBestDivider:T[] = [];
    let bestDivider:[T, T] = <[T, T]><unknown>undefined;
    let front:T = <T><unknown>undefined;
    let back:T = <T><unknown>undefined;
    for (let i = 0; i < points.length; i++) {
        const a = points[i];
        for (let j = i+1; j < points.length; j++) {
            const b = points[j];
            // isFront should be  on the side of a
            const divider = calculateDivider(a, b);
            const inFront: T[] = [], inBack: T[] = [];
            points.forEach((point) => {
                if(isFront(point, divider))
                    inFront.push(point);
                else
                    inBack.push(point);
            });
            // Use absolute difference to find the best balanced split
            const difference = Math.abs(inFront.length - inBack.length);
            // Prefer dividers that actually separate points (both sides non-empty)
            const isBetterDivider = inFront.length > 0 && inBack.length > 0 
                ? difference < minDifference
                : inFrontOfBestDivider.length === 0 && inBackOfBestDivider.length === 0;
            
            if(isBetterDivider){
                bestDivider = divider;
                minDifference = difference;
                inFrontOfBestDivider = inFront;
                inBackOfBestDivider = inBack;
                front = a;
                back = b;
            }
            if(minDifference == 0) break;
        }
        if(minDifference == 0) break;
    }
    // Prevent infinite recursion if divider couldn't separate points
    if(inFrontOfBestDivider.length === 0 || inBackOfBestDivider.length === 0) {
        if(update) update(1);
        return null;
    }
    const response = {
        divider: bestDivider,
        front,
        back,
        inFront: generateBsptFromPoints<T>(
            inFrontOfBestDivider, calculateDivider, isFront, update&&((x)=>update(x*inFrontOfBestDivider.length/points.length))),
        inBack: generateBsptFromPoints<T>(
            inBackOfBestDivider, calculateDivider, isFront, update&&((x)=>update((inFrontOfBestDivider.length+x*inBackOfBestDivider.length)/points.length))) };
    if(update)update(1);
    return response;
}

export function findBsptClosest<T>(point:T, bspt:bspNode<T>, isFront:(point:T, divider:[T, T])=>boolean):T{
    if(null===bspt)return point;
    if(isFront(point, bspt.divider)){
        if(bspt.inFront)
            return findBsptClosest(point, bspt.inFront, isFront);
        else
            return bspt.front;
    }
    else if(bspt.inBack)
        return findBsptClosest(point, bspt.inBack, isFront);
    else
        return bspt.back;
}