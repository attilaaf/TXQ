 
 
export interface IReplayableEventStorage {

    addEvent(message: any): Promise<number>;
}

export class ReplayableEventStorage implements IReplayableEventStorage {
    constructor() {
    }
    async addEvent(message: any): Promise<number> {
        throw new Error("Method not implemented.");
    }
}