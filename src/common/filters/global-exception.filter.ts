import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    // Handle NestJS HTTP exceptions
    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const res = exceptionResponse as Record<string, any>;
        message = res.message || exception.message;
        error = res.error || 'Error';
      }
    }
    // Handle TypeORM QueryFailedError (database errors)
    else if (exception instanceof QueryFailedError) {
      const driverError = (exception as any).driverError;

      if (driverError?.code === 'ER_DUP_ENTRY') {
        statusCode = HttpStatus.CONFLICT;
        error = 'Conflict';
        message = 'A record with this value already exists';
      } else if (
        driverError?.code === 'ER_NO_REFERENCED_ROW_2' ||
        driverError?.code === 'ER_NO_REFERENCED_ROW'
      ) {
        statusCode = HttpStatus.BAD_REQUEST;
        error = 'Bad Request';
        message = 'Referenced record does not exist';
      } else {
        statusCode = HttpStatus.BAD_REQUEST;
        error = 'Database Error';
        message = 'A database error occurred';
      }

      this.logger.error(
        `Database error: ${driverError?.code} - ${driverError?.sqlMessage}`,
        (exception as Error).stack,
      );
    }
    // Handle unknown errors
    else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
      message = exception.message;
    }

    response.status(statusCode).json({
      statusCode,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
