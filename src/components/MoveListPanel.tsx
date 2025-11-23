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

interface MoveListPanelProps {
  moves: MoveHistoryItem[]
  currentMoveIndex: number
  onMoveClick: (moveIndex: number) => void
}

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

                return (
                  <TableRow key={move.moveNumber}>
                    <TableCell className="font-medium">
                      {move.moveNumber}
                    </TableCell>
                    <TableCell
                      className={`cursor-pointer hover:bg-muted transition-colors duration-150 ${
                        isWhiteActive ? "bg-accent/10 font-semibold" : ""
                      }`}
                      onClick={() => onMoveClick(whiteIndex)}
                    >
                      {move.white}
                    </TableCell>
                    <TableCell
                      className={`cursor-pointer hover:bg-muted transition-colors duration-150 ${
                        isBlackActive ? "bg-accent/10 font-semibold" : ""
                      }`}
                      onClick={() => move.black && onMoveClick(blackIndex)}
                    >
                      {move.black}
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
