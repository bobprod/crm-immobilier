import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';

/**
 * Centralized error handling utilities
 */

export class ErrorHandler {
  /**
   * Throw NotFoundException with consistent message format
   */
  static notFound(resourceType: string, identifier?: string): never {
    const message = identifier
      ? `${resourceType} with identifier '${identifier}' not found`
      : `${resourceType} not found`;
    throw new NotFoundException(message);
  }

  /**
   * Throw BadRequestException with custom message
   */
  static badRequest(message: string): never {
    throw new BadRequestException(message);
  }

  /**
   * Throw ForbiddenException for unauthorized access
   */
  static forbidden(message = 'Access forbidden'): never {
    throw new ForbiddenException(message);
  }

  /**
   * Check if resource exists, throw NotFoundException if not
   */
  static ensureExists<T>(
    resource: T | null | undefined,
    resourceType: string,
    identifier?: string,
  ): NonNullable<T> {
    if (!resource) {
      this.notFound(resourceType, identifier);
    }
    return resource as NonNullable<T>;
  }

  /**
   * Check if user owns resource, throw ForbiddenException if not
   */
  static ensureOwnership(
    resource: { userId: string } | null | undefined,
    userId: string,
    resourceType: string,
  ): void {
    if (!resource) {
      this.notFound(resourceType);
    }
    if (resource.userId !== userId) {
      this.forbidden(`You don't have permission to access this ${resourceType}`);
    }
  }

  /**
   * Validate that required fields are present
   */
  static validateRequired(fields: Record<string, any>): void {
    const missing = Object.entries(fields)
      .filter(([_, value]) => value === undefined || value === null || value === '')
      .map(([key]) => key);

    if (missing.length > 0) {
      this.badRequest(`Missing required fields: ${missing.join(', ')}`);
    }
  }
}
