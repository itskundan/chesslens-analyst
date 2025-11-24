import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { MoveHistoryItem } from "@/types/chess"
import { cn } from "@/lib/utils"

interface MoveListPanelProps {
  moves: MoveHistoryItem[]
  currentMoveIndex: number
  onMoveClick: (moveIndex: number) => void
}

const MovePill = ({
  move,
  isActive,
  isPlayed,
}: {
  move: MoveHistoryItem["white"]
  isActive: boolean
  isPlayed: boolean
}) => (
  <div
    className={cn(
      "rounded-full px-3 py-1 text-sm font-medium min-h-9 flex items-center justify-center text-center w-full",
      isActive && "bg-accent text-accent-foreground shadow-sm",
      !isActive && move?.isCustom &&
        "bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100 border border-amber-200/80 dark:border-amber-500/40",
      !isActive && !move?.isCustom && isPlayed && "bg-muted/60 dark:bg-muted/20",
      !isPlayed && "bg-transparent text-muted-foreground"
    )}
  >
    {move?.san ?? "-"}
  </div>
)

export function MoveListPanel({
  moves,
  currentMoveIndex,
  onMoveClick,
}: MoveListPanelProps) {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Move History
      </h2>
      <Separator className="mb-4" />
      <div className="max-h-[600px] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead>White</TableHead>
              <TableHead>Black</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {moves.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-muted-foreground py-8"
                >
                  No moves yet
                </TableCell>
              </TableRow>
            ) : (
              moves.map((move) => {
                const whiteIndex = (move.moveNumber - 1) * 2
                const blackIndex = whiteIndex + 1
                const isWhiteActive = currentMoveIndex === whiteIndex
                const isBlackActive = currentMoveIndex === blackIndex
                const isWhitePlayed = currentMoveIndex >= whiteIndex
                const isBlackPlayed = move.black && currentMoveIndex >= blackIndex

                return (
                  <TableRow key={move.moveNumber}>
                    <TableCell className="font-medium">
                      {move.moveNumber}
                    </TableCell>
                    <TableCell
                      className="cursor-pointer py-2"
                      onClick={() => move.white && onMoveClick(whiteIndex)}
                    >
                      <div className="flex justify-center">
                        <MovePill
                          move={move.white}
                          isActive={isWhiteActive}
                          isPlayed={isWhitePlayed}
                        />
                      </div>
                    </TableCell>
                    <TableCell
                      className="cursor-pointer py-2"
                      onClick={() => move.black && onMoveClick(blackIndex)}
                    >
                      <div className="flex justify-center">
                        <MovePill
                          move={move.black}
                          isActive={isBlackActive}
                          isPlayed={isBlackPlayed}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
