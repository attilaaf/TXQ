import { UseCaseOutcome } from './UseCaseOutcome';

export abstract class UseCase {
   public async execute(params: any): Promise<UseCaseOutcome> {
      try {
         return await this.run(params);
      } catch (err) {
         return {
            success: false,
            result: err
         };
      }
   }
   public abstract async run(params: any): Promise<UseCaseOutcome>;
}
