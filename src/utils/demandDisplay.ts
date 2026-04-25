import { DemandStatusEnum } from '../types/demandStatus';
import type { DemandResponseDto } from '../service/search.api.service';

export function demandStatusChipColor(
    status: DemandStatusEnum
): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
    switch (status) {
        case DemandStatusEnum.ACTIVE:
            return 'success';
        case DemandStatusEnum.PENDING_REVIEW:
            return 'warning';
        case DemandStatusEnum.DECLINED:
            return 'error';
        case DemandStatusEnum.INACTIVE:
            return 'default';
        default:
            return 'default';
    }
}

export function formatDemandStatus(status: DemandStatusEnum): string {
    return status
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (l) => l.toUpperCase());
}

/** Single line for tables: transcription, then translation, then summary. */
export function demandTextPreview(demand: DemandResponseDto, maxLen = 120): string {
    const raw =
        demand.transcription?.trim() ||
        demand.translation?.trim() ||
        demand.summarizedTranslation?.trim() ||
        '—';
    if (raw.length <= maxLen) return raw;
    return `${raw.slice(0, maxLen)}…`;
}
