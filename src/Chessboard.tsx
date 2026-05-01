import { createBoard, type Chessboard as CoreChessboard } from '@mirasen/chessboard';
import { useEffect, useRef } from 'react';
import type { ChessboardProps } from './types.js';

export function Chessboard({
	position,
	externalMove,
	orientation,
	movability,
	onUIMove,
	autoPromoteToQueen,
	className,
	style
}: ChessboardProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const boardRef = useRef<CoreChessboard | null>(null);
	const onUIMoveRef = useRef(onUIMove);
	const lastPositionIdRef = useRef<string | number | null>(null);
	const lastExternalMoveIdRef = useRef<string | number | null>(null);

	// Keep latest callback in ref
	onUIMoveRef.current = onUIMove;

	// Board creation and destruction
	useEffect(() => {
		if (!containerRef.current) return;

		const board = createBoard({ element: containerRef.current });
		boardRef.current = board;

		board.extensions.events.setOnUIMove((move) => {
			onUIMoveRef.current?.(move);
		});

		return () => {
			board.extensions.events.setOnUIMove(null);
			board.destroy();
			boardRef.current = null;
		};
	}, []);

	// Position sync
	useEffect(() => {
		if (!boardRef.current) return;
		if (lastPositionIdRef.current === position.id) return;
		boardRef.current.setPosition(position.position);
		lastPositionIdRef.current = position.id;
	}, [position.id, position.position]);

	// External move sync
	useEffect(() => {
		if (!boardRef.current) return;
		if (!externalMove) return;
		if (lastExternalMoveIdRef.current === externalMove.id) return;
		boardRef.current.move(externalMove.move);
		lastExternalMoveIdRef.current = externalMove.id;
	}, [externalMove?.id, externalMove?.move]);

	// Orientation sync
	useEffect(() => {
		if (!boardRef.current) return;
		if (orientation === undefined) return;
		boardRef.current.setOrientation(orientation);
	}, [orientation]);

	// Movability sync
	useEffect(() => {
		if (!boardRef.current) return;
		if (movability === undefined) return;
		boardRef.current.setMovability(movability);
	}, [movability]);

	// autoPromoteToQueen sync
	useEffect(() => {
		if (!boardRef.current) return;
		boardRef.current.extensions.autoPromote.toQueen = autoPromoteToQueen ?? false;
	}, [autoPromoteToQueen]);

	return <div ref={containerRef} className={className} style={style} />;
}
