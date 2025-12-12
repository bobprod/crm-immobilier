import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let errorDetails: any = {};

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            message = typeof exceptionResponse === 'string'
                ? exceptionResponse
                : (exceptionResponse as any).message || message;
            errorDetails = typeof exceptionResponse === 'object' ? exceptionResponse : {};
        } else if (exception instanceof Error) {
            message = exception.message;
            errorDetails = {
                name: exception.name,
                stack: exception.stack,
            };
        }

        // Log the full error
        this.logger.error(
            `${request.method} ${request.url} - ${status} - ${message}`,
            exception instanceof Error ? exception.stack : JSON.stringify(exception),
        );

        // In development, include more details
        const isDev = process.env.NODE_ENV !== 'production';

        response.status(status).json({
            statusCode: status,
            message: message,
            timestamp: new Date().toISOString(),
            path: request.url,
            ...(isDev && {
                error: errorDetails,
                details: exception instanceof Error ? exception.message : String(exception),
            }),
        });
    }
}
