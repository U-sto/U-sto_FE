import { useMemo } from 'react'
import {
  CODE_GROUP,
  buildCodeToDescriptionMap,
  buildDescriptionToCodeMap,
  buildFilterOptionsWithAll,
  buildSelectOptionsWithPlaceholder,
} from '../api/codes'
import { useCommonCodeGroup } from './useCommonCodeGroup'

const FALLBACK_OPER_FILTER = ['전체', '운용중', '반납', '불용', '처분']
const FALLBACK_APPR_FILTER = ['전체', '대기', '반려', '확정']
const FALLBACK_ITEM_SELECT = ['선택', '운용중', '반납', '불용', '처분']

const OPER_STS_LABEL_TO_CODE_FALLBACK: Record<string, string> = {
  운용중: 'OPER',
  반납: 'RTN',
  불용: 'DSU',
  처분: 'DSP',
}

/** 운용 전환·처분 등 — APPR_STS: WAIT / REJECT / CONFIRM */
const APPR_LABEL_TO_CODE_TRANSFER_STYLE: Record<string, string> = {
  전체: '',
  대기: 'WAIT',
  승인요청: 'REQUEST',
  반려: 'REJECT',
  확정: 'CONFIRM',
}

/** 불용 목록 API — apprSts: WAIT / REQUEST / REJECTED / APPROVED */
const APPR_LABEL_TO_CODE_DISUSE_STYLE: Record<string, string> = {
  전체: '',
  대기: 'WAIT',
  승인요청: 'REQUEST',
  반려: 'REJECTED',
  확정: 'APPROVED',
}

/**
 * 운용상태 필터(전체) — GET /api/codes/OPER_STATUS 우선, 없으면 ITEM_STATUS
 */
export function useOperatingStatusFilterOptions() {
  const { group: operGroup } = useCommonCodeGroup(CODE_GROUP.OPER_STATUS)
  const { group: itemGroup } = useCommonCodeGroup(CODE_GROUP.ITEM_STATUS)
  const descToCode = useMemo(() => {
    const o = buildDescriptionToCodeMap(operGroup ?? undefined)
    if (Object.keys(o).length > 0) return o
    return buildDescriptionToCodeMap(itemGroup ?? undefined)
  }, [operGroup, itemGroup])
  const options = useMemo(() => {
    if (Object.keys(descToCode).length > 0) {
      return buildFilterOptionsWithAll(descToCode)
    }
    return FALLBACK_OPER_FILTER
  }, [descToCode])
  return { options, descToCode }
}

/**
 * 승인상태 필터(전체) — GET /api/codes/APPR_STATUS
 */
export function useApprovalStatusFilterOptions() {
  const { group: apprGroup } = useCommonCodeGroup(CODE_GROUP.APPR_STATUS)
  const descToCode = useMemo(
    () => buildDescriptionToCodeMap(apprGroup ?? undefined),
    [apprGroup],
  )
  const options = useMemo(() => {
    if (Object.keys(descToCode).length > 0) {
      return buildFilterOptionsWithAll(descToCode)
    }
    return FALLBACK_APPR_FILTER
  }, [descToCode])
  return { options, descToCode }
}

/**
 * 물품상태 선택(선택) — 등록 폼용, ITEM_STATUS 우선
 */
export function useItemStatusSelectOptions() {
  const { group: itemGroup } = useCommonCodeGroup(CODE_GROUP.ITEM_STATUS)
  const { group: operGroup } = useCommonCodeGroup(CODE_GROUP.OPER_STATUS)
  const descToCode = useMemo(() => {
    const fromItem = buildDescriptionToCodeMap(itemGroup ?? undefined)
    if (Object.keys(fromItem).length > 0) return fromItem
    return buildDescriptionToCodeMap(operGroup ?? undefined)
  }, [itemGroup, operGroup])
  const codeToDesc = useMemo(() => {
    const g = itemGroup?.codes?.length ? itemGroup : operGroup
    return buildCodeToDescriptionMap(g ?? undefined)
  }, [itemGroup, operGroup])
  const options = useMemo(() => {
    if (Object.keys(descToCode).length > 0) {
      return buildSelectOptionsWithPlaceholder(descToCode)
    }
    return FALLBACK_ITEM_SELECT
  }, [descToCode])
  return { options, descToCode, codeToDesc }
}

/** 대장·목록 조회: 화면 라벨 → operSts API 코드 */
export function resolveOperatingStatusFilterValue(
  label: string,
  descToCode: Record<string, string>,
): string {
  if (!label || label === '전체') return '전체'
  return descToCode[label] ?? OPER_STS_LABEL_TO_CODE_FALLBACK[label] ?? label
}

/** 운용 전환·처분·요청관리 운용 등록 등 */
export function resolveApprovalFilterTransferStyle(
  label: string,
  descToCode: Record<string, string>,
): string {
  if (!label || label === '전체') return '전체'
  return descToCode[label] ?? APPR_LABEL_TO_CODE_TRANSFER_STYLE[label] ?? label
}

/** 불용 등록 목록 API (REJECTED 등) */
export function resolveApprovalFilterDisuseStyle(
  label: string,
  descToCode: Record<string, string>,
): string {
  if (!label || label === '전체') return '전체'
  return descToCode[label] ?? APPR_LABEL_TO_CODE_DISUSE_STYLE[label] ?? label
}
