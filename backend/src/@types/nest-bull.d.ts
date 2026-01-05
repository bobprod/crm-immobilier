declare module '@nestjs/bull' {
    export const InjectQueue: any;
    export const Process: any;
    export const Processor: any;
    export const BullModule: any;
}

declare module 'bull' {
    export type Queue = any;
    export type Job<T = any> = {
        id: string | number;
        data: T;
        progress?: (v: number) => void;
        getState?: () => Promise<string>;
        finished?: () => Promise<any>;
    };
    export const Job: any;
    const Bull: any;
    export default Bull;
}
