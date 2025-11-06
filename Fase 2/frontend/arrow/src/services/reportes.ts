import { http } from '@/lib/http';

export type ReportRow = { /* ... */ };

export async function listarReportes(limit = 100, offset = 0) {
    const { data } = await http.get('/api/reportes', { params: { limit, offset } });
    return data as ReportRow[];
}