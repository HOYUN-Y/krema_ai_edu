import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: true });

const BASE_URL = "https://apis.data.go.kr";
const SERVICE_KEY = process.env.API_SERVICE_KEY ?? "";

function parseXml(xml: string) {
  return parser.parse(xml);
}

async function fetchApi(path: string, params: Record<string, string>) {
  const qs = new URLSearchParams({
    serviceKey: SERVICE_KEY,
    numOfRows: "20",
    pageNo: "1",
    ...params,
  });
  const url = `${BASE_URL}${path}?${qs.toString()}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const text = await res.text();
  return parseXml(text);
}

// 분양정보 조회 (APT 분양 공고)
export async function getAnnouncements(pageNo = "1") {
  const data = await fetchApi(
    "/B551408/RTHC_BldgMngtR/getAPTLttotPblancMaster",
    { pageNo, numOfRows: "20" }
  );
  const items = data?.response?.body?.items?.item ?? [];
  return {
    totalCount: data?.response?.body?.totalCount ?? 0,
    items: Array.isArray(items) ? items : [items],
  };
}

// 청약 경쟁률 및 특별공급 신청현황
export async function getCompetition(houseManageNo: string) {
  const data = await fetchApi(
    "/B551408/RTHC_BldgMngtR/getAPTLttotPblancDetail",
    { houseManageNo }
  );
  const items = data?.response?.body?.items?.item ?? [];
  return Array.isArray(items) ? items : [items];
}

// 청약 신청·당첨자 정보
export async function getApplicants(houseManageNo: string) {
  const data = await fetchApi(
    "/B551408/RTHC_BldgMngtR/getAPTLttotWinnerListInfo",
    { houseManageNo }
  );
  const items = data?.response?.body?.items?.item ?? [];
  return Array.isArray(items) ? items : [items];
}
