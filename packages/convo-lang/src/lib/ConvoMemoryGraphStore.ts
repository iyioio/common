import { Observable, Subject } from "rxjs";
import { ConvoEdge, ConvoEdgeSide, ConvoGraphStore, ConvoNode, ConvoTraverser } from "./convo-graph-types";

export interface ConvoMemoryGraphStoreDb
{
    nodes:ConvoNode[];
    edges:ConvoEdge[];
    traversers:ConvoTraverser[];
}

export interface ConvoMemoryGraphStoreOptions
{
    db?:Partial<ConvoMemoryGraphStoreDb>;
}

export class ConvoMemoryGraphStore implements ConvoGraphStore
{
    public db:ConvoMemoryGraphStoreDb;

    private readonly _onDbChange=new Subject<void>();
    public get onDbChange():Observable<void>{return this._onDbChange}

    public constructor({
        db={
            nodes:[],
            edges:[],
            traversers:[],
        }
    }:ConvoMemoryGraphStoreOptions={}){
        this.db={
            nodes:db.nodes??[],
            edges:db.edges??[],
            traversers:db.traversers??[],
        }
    }

    public getNodeAsync(id:string):Promise<ConvoNode|undefined>
    {
        return Promise.resolve(this.db.nodes.find(g=>g.id===id));

    }

    public putNodeAsync(node:ConvoNode):Promise<void>
    {
        const index=this.db.nodes.findIndex(g=>g.id===node.id);
        if(index===-1){
            this.db.nodes.push(node);
        }else{
            this.db.nodes[index]=node;
        }
        this._onDbChange.next();
        return Promise.resolve();
    }

    public deleteNodeAsync(id:string):Promise<void>
    {
        const index=this.db.nodes.findIndex(g=>g.id===id);
        if(index!==-1){
            this.db.nodes.splice(index,1);
        }
        this._onDbChange.next();
        return Promise.resolve();
    }

    public getNodeEdgesAsync(nodeId:string,side:ConvoEdgeSide):Promise<ConvoEdge[]>
    {
        return Promise.resolve(this.db.edges.filter(e=>side==='to'?
            e.to===nodeId:
            (e.from===nodeId || e.from.startsWith(nodeId+'.'))
        ))
    }


    public getEdgeAsync(id:string):Promise<ConvoEdge|undefined>
    {
        return Promise.resolve(this.db.edges.find(g=>g.id===id));

    }

    public putEdgeAsync(edge:ConvoEdge):Promise<void>
    {
        const index=this.db.edges.findIndex(g=>g.id===edge.id);
        if(index===-1){
            this.db.edges.push(edge);
        }else{
            this.db.edges[index]=edge;
        }
        this._onDbChange.next();
        return Promise.resolve();
    }

    public deleteEdgeAsync(id:string):Promise<void>
    {
        const index=this.db.edges.findIndex(g=>g.id===id);
        if(index!==-1){
            this.db.edges.splice(index,1);
        }
        this._onDbChange.next();
        return Promise.resolve();
    }



    public getTraverserAsync(id:string):Promise<ConvoTraverser|undefined>
    {
        return Promise.resolve(this.db.traversers.find(g=>g.id===id));

    }

    public putTraverserAsync(traverser:ConvoTraverser):Promise<void>
    {
        const index=this.db.traversers.findIndex(g=>g.id===traverser.id);
        if(index===-1){
            this.db.traversers.push(traverser);
        }else{
            this.db.traversers[index]=traverser;
        }
        this._onDbChange.next();
        return Promise.resolve();
    }

    public deleteTraverserAsync(id:string):Promise<void>
    {
        const index=this.db.traversers.findIndex(g=>g.id===id);
        if(index!==-1){
            this.db.traversers.splice(index,1);
        }
        this._onDbChange.next();
        return Promise.resolve();
    }
}
