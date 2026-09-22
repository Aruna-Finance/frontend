import { mockPositionCovers, mockPositions } from "@/lib/mock/positions";
import type { Position, PositionCover } from "@/types/domain";

export interface UsePositionsResult {
  data: Position[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

export function usePositions(): UsePositionsResult {
  return { data: mockPositions, isLoading: false, isError: false };
}

export interface UsePositionResult {
  data: Position | undefined;
  covers: PositionCover[];
  isLoading: boolean;
  isError: boolean;
}

export function usePosition(tokenId: string): UsePositionResult {
  const position = mockPositions.find((item) => item.tokenId === tokenId);
  const covers = mockPositionCovers.filter((cover) => cover.positionId === tokenId);
  return { data: position, covers, isLoading: false, isError: false };
}

export interface UseCoverResult {
  data: PositionCover | undefined;
  isLoading: boolean;
  isError: boolean;
}

export function useCover(coverId: string): UseCoverResult {
  const cover = mockPositionCovers.find((item) => item.id === coverId);
  return { data: cover, isLoading: false, isError: false };
}
