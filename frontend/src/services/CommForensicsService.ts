/**
 * Communication Forensics Service
 * Handles multimodal communication ingestion and transaction mapping
 */

import { API_URL } from '../lib/constants';
import { authenticatedFetch } from '../lib/api';

export enum CommunicationType {
  WHATSAPP = 'whatsapp',
  SIGNAL = 'signal',
  EMAIL = 'email',
  TELEGRAM = 'telegram',
  SMS = 'sms',
  GENERIC_CHAT = 'generic_chat'
}

export enum MessageIntent {
  FINANCIAL_TRANSFER = 'financial_transfer',
  PAYMENT_CONFIRMATION = 'payment_confirmation',
  BRIBERY = 'bribery',
  COLLUSION = 'collusion',
  DISCUSSION = 'discussion',
  THREAT = 'threat',
  COORDINATION = 'coordination',
  UNKNOWN = 'unknown'
}

export interface CommunicationExport {
  id: string;
  project_id: string;
  source_type: CommunicationType;
  filename: string;
  file_hash: string;
  total_messages: number;
  processed_messages: number;
  status: string;
  ingestion_date: string;
}

export interface CommunicationMessage {
  id: string;
  export_id: string;
  project_id: string;
  message_text: string;
  sender: string;
  receiver?: string;
  group_name?: string;
  message_timestamp: string;
  intent_classification: MessageIntent;
  confidence_score: number;
  extracted_entities: Record<string, any>;
  extracted_amounts: Array<{ amount: number; currency: string }>;
  status: string;
}

export interface CommunicationTransactionLink {
  id: string;
  message_id: string;
  transaction_id: string;
  confidence_score: number;
  link_type: string;
  time_delta_minutes: number;
  matching_entities: string[];
  matching_amounts: number[];
  matching_keywords: string[];
  verification_status: string;
}

export interface UploadResponse {
  export_id: string;
  total_messages: number;
  status: string;
}

export interface MappingResponse {
  total_links: number;
  high_confidence_links: number;
  links: CommunicationTransactionLink[];
}

class CommForensicsService {
  /**
   * Upload and ingest communication export file
   */
  async uploadCommunicationExport(
    projectId: string,
    file: File,
    sourceType: CommunicationType
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_type', sourceType);
    formData.append('project_id', projectId);

    const response = await authenticatedFetch(
      `${API_URL}/api/v1/comm-forensics/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Failed to upload communication export');
    }

    return response.json();
  }

  /**
   * Get all communication exports for a project
   */
  async getExports(projectId: string): Promise<CommunicationExport[]> {
    const response = await authenticatedFetch(
      `${API_URL}/api/v1/comm-forensics/projects/${projectId}/exports`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch communication exports');
    }

    return response.json();
  }

  /**
   * Get messages from a specific export
   */
  async getMessages(
    exportId: string,
    filters?: {
      intent?: MessageIntent;
      min_confidence?: number;
      sender?: string;
    }
  ): Promise<CommunicationMessage[]> {
    const params = new URLSearchParams();
    if (filters?.intent) params.append('intent', filters.intent);
    if (filters?.min_confidence) params.append('min_confidence', filters.min_confidence.toString());
    if (filters?.sender) params.append('sender', filters.sender);

    const response = await authenticatedFetch(
      `${API_URL}/api/v1/comm-forensics/exports/${exportId}/messages?${params}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }

    return response.json();
  }

  /**
   * Get all messages for a project with search and filtering
   */
  async getProjectMessages(
    projectId: string,
    filters?: {
      status?: string;
      search?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ messages: CommunicationMessage[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await authenticatedFetch(
      `${API_URL}/api/v1/comm-forensics/${projectId}/messages?${params}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch project messages');
    }

    return response.json();
  }

  /**
   * Trigger automatic message-transaction mapping
   */
  async mapCommunicationsToTransactions(
    projectId: string,
    options?: {
      time_window_hours?: number;
      min_confidence?: number;
    }
  ): Promise<MappingResponse> {
    const response = await authenticatedFetch(
      `${API_URL}/api/v1/comm-forensics/projects/${projectId}/map`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options || {}),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to map communications to transactions');
    }

    return response.json();
  }

  /**
   * Get communication-transaction links for a project
   */
  async getLinks(
    projectId: string,
    filters?: {
      min_confidence?: number;
      verification_status?: string;
    }
  ): Promise<CommunicationTransactionLink[]> {
    const params = new URLSearchParams();
    if (filters?.min_confidence) params.append('min_confidence', filters.min_confidence.toString());
    if (filters?.verification_status) params.append('verification_status', filters.verification_status);

    const response = await authenticatedFetch(
      `${API_URL}/api/v1/comm-forensics/projects/${projectId}/links?${params}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch communication links');
    }

    return response.json();
  }

  /**
   * Verify or reject a communication-transaction link
   */
  async verifyLink(
    linkId: string,
    verified: boolean,
    userId: string
  ): Promise<void> {
    const response = await authenticatedFetch(
      `${API_URL}/api/v1/comm-forensics/links/${linkId}/verify`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verified,
          user_id: userId,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to verify link');
    }
  }

  /**
   * Get timeline view with both communications and transactions
   */
  async getTimelineView(
    projectId: string,
    filters?: {
      startDate?: string;
      endDate?: string;
      search?: string;
      limit?: number;
    }
  ): Promise<any> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('start_date', filters.startDate);
    if (filters?.endDate) params.append('end_date', filters.endDate);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await authenticatedFetch(
      `${API_URL}/api/v1/comm-forensics/projects/${projectId}/timeline?${params}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch timeline view');
    }

    return response.json();
  }
}

export const commForensicsService = new CommForensicsService();
