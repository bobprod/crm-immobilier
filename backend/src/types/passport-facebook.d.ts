declare module 'passport-facebook' {
  import { Strategy as PassportStrategy } from 'passport';

  export interface Profile {
    id: string;
    displayName: string;
    name?: {
      familyName?: string;
      givenName?: string;
      middleName?: string;
    };
    emails?: Array<{ value: string }>;
    photos?: Array<{ value: string }>;
    provider: string;
    _raw: string;
    _json: any;
  }

  export interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string[];
    profileFields?: string[];
    passReqToCallback?: boolean;
  }

  export type VerifyCallback = (error: any, user?: any, info?: any) => void;

  export type VerifyFunction = (
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) => void;

  export class Strategy extends PassportStrategy {
    constructor(options: StrategyOptions, verify: VerifyFunction);
    name: string;
  }
}
