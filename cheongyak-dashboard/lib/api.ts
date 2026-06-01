/**
 * 한국부동산원 청약홈 공공데이터 API
 * Base URL: https://api.odcloud.kr/api
 *
 * ★ 주의: totalCount는 cond 필터와 무관한 전체 dataset 크기
 *          필터가 적용된 실제 결과 수는 matchCount를 사용할 것
 *
 * [API 1] 분양정보 조회 서비스 (ApplyhomeInfoDetailSvc) — TTL 15분
 * [API 2] 경쟁률 및 특별공급 신청현황 (ApplyhomeInfoCmpetRtSvc) — TTL 5분
 * [API 3] 청약 신청·당첨자 정보 조회 (ApplyhomeStatSvc) — TTL 60분
 */

const BASE_URL = "https://api.odcloud.kr/api";
// ★ 보안: NEXT_PUBLIC_ 접두사 없음 — 서버 전용, 브라우저 번들에 절대 노출 안 됨
const SERVICE_KEY = process.env.APPLYHOME_SERVICE_KEY ?? "";

export type FilterType = "전체" | "수도권" | "민영";
const SUDOGWON_NAMES = ["서울", "경기", "인천"];

async function fetchApi(path: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams({
    page: "1",
    perPage: "20",
    serviceKey: SERVICE_KEY,
    ...params,
  });
  const url = `${BASE_URL}${path}?${qs.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`API error: ${res.status} (${url})`);
  return res.json();
}

/** 클라이언트 필터링 (수도권·민영) */
function applyFilter(items: Record<string, string | number>[], filter: FilterType) {
  if (filter === "수도권") {
    return items.filter(i => SUDOGWON_NAMES.includes(String(i.SUBSCRPT_AREA_CODE_NM ?? "")));
  }
  if (filter === "민영") {
    return items.filter(i => String(i.HOUSE_DTL_SECD ?? "") === "01" || String(i.HOUSE_DTL_SECD_NM ?? "") === "민영");
  }
  return items;
}

// ── API 1: 분양정보 ────────────────────────────────────────────

/** APT 분양정보 상세조회 — 필터 지원 */
export async function getAPTAnnouncements(page = "1", perPage = "20", filter: FilterType = "전체") {
  const data = await fetchApi("/ApplyhomeInfoDetailSvc/v1/getAPTLttotPblancDetail", { page, perPage });
  const allItems = (data?.data ?? []) as Record<string, string | number>[];
  const items = applyFilter(allItems, filter);
  return {
    totalCount: data?.totalCount ?? 0,   // 전체 dataset 크기 (필터 무관)
    matchCount: data?.matchCount ?? 0,   // ★ 실제 필터 결과 수 (KPI·페이지네이션 사용)
    filteredCount: items.length,         // 클라이언트 필터 후 건수
    currentCount: data?.currentCount ?? 0,
    items,
  };
}

/** APT 분양정보 주택형별 상세조회 */
export async function getAPTHouseTypes(houseManageNo: string) {
  const data = await fetchApi("/ApplyhomeInfoDetailSvc/v1/getAPTLttotPblancMdl", {
    "cond[HOUSE_MANAGE_NO::EQ]": houseManageNo,
    perPage: "50",
  });
  return {
    matchCount: data?.matchCount ?? 0,
    items: (data?.data ?? []) as Record<string, string | number>[],
  };
}

// ── API 2: 경쟁률 ──────────────────────────────────────────────

/** APT 분양정보/경쟁률 조회 — 필터 지원 */
export async function getAPTCompetition(page = "1", houseManageNo?: string, filter: FilterType = "전체") {
  const params: Record<string, string> = { page, perPage: "20" };
  if (houseManageNo) params["cond[HOUSE_MANAGE_NO::EQ]"] = houseManageNo;
  const data = await fetchApi("/ApplyhomeInfoCmpetRtSvc/v1/getAPTLttotPblancCmpet", params);
  const allItems = (data?.data ?? []) as Record<string, string | number>[];
  const items = applyFilter(allItems, filter);
  return {
    totalCount: data?.totalCount ?? 0,
    matchCount: data?.matchCount ?? 0,   // ★ KPI·페이지네이션용
    filteredCount: items.length,
    items,
  };
}

/** APT 특별공급 신청현황 조회 */
export async function getSpecialSupply(page = "1") {
  const data = await fetchApi("/ApplyhomeInfoCmpetRtSvc/v1/getAPTSpsplyReqstStus", {
    page, perPage: "20",
  });
  return {
    totalCount: data?.totalCount ?? 0,
    matchCount: data?.matchCount ?? 0,
    items: (data?.data ?? []) as Record<string, string | number>[],
  };
}

// ── API 3: 신청·당첨자 통계 ────────────────────────────────────

/** 지역별 청약 신청자 정보 조회 */
export async function getReqstAreaStat(page = "1") {
  const data = await fetchApi("/ApplyhomeStatSvc/v1/getAPTReqstAreaStat", {
    page, perPage: "50",
  });
  return {
    totalCount: data?.totalCount ?? 0,
    matchCount: data?.matchCount ?? 0,
    items: (data?.data ?? []) as Record<string, string | number>[],
  };
}

/** 지역별 청약 당첨자 정보 조회 */
export async function getPrzwnerAreaStat(page = "1") {
  const data = await fetchApi("/ApplyhomeStatSvc/v1/getAPTPrzwnerAreaStat", {
    page, perPage: "50",
  });
  return {
    totalCount: data?.totalCount ?? 0,
    matchCount: data?.matchCount ?? 0,
    items: (data?.data ?? []) as Record<string, string | number>[],
  };
}

/** 지역별 청약 경쟁률 정보 조회 */
export async function getCmpetrtAreaStat(page = "1") {
  const data = await fetchApi("/ApplyhomeStatSvc/v1/getAPTCmpetrtAreaStat", {
    page, perPage: "50",
  });
  return {
    totalCount: data?.totalCount ?? 0,
    matchCount: data?.matchCount ?? 0,
    items: (data?.data ?? []) as Record<string, string | number>[],
  };
}
