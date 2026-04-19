export interface JWTPayload {
    sub: string;
    email: string;
    iat: number;
    exp: number;
}

export interface ResumeUpdatePatch {
    name?: string;
    language?: string;
    data?: unknown;
    settings?: unknown;
    isActive?: boolean;
}
