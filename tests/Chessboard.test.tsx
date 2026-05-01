import type { MoveOutput } from '@mirasen/chessboard';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Chessboard } from '../src/Chessboard.js';

type OnUIMoveHandler = (move: MoveOutput) => void;

const mockBoard = vi.hoisted(() => ({
	setPosition: vi.fn(() => true),
	move: vi.fn(),
	setOrientation: vi.fn(() => true),
	setMovability: vi.fn(() => true),
	destroy: vi.fn(),
	extensions: {
		events: {
			setOnUIMove: vi.fn()
		},
		autoPromote: {
			toQueen: false
		}
	}
}));

vi.mock('@mirasen/chessboard', () => ({
	createBoard: vi.fn(() => mockBoard)
}));

const { createBoard } = await import('@mirasen/chessboard');

describe('Chessboard', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockBoard.extensions.autoPromote.toQueen = false;
	});

	afterEach(() => {
		cleanup();
	});

	it('mount creates core board once', () => {
		render(<Chessboard position={{ id: 1, position: 'start' }} />);

		expect(createBoard).toHaveBeenCalledTimes(1);
		expect(createBoard).toHaveBeenCalledWith({ element: expect.any(HTMLDivElement) });
	});

	it('unmount destroys core board', () => {
		const { unmount } = render(<Chessboard position={{ id: 1, position: 'start' }} />);

		unmount();

		expect(mockBoard.destroy).toHaveBeenCalledTimes(1);
	});

	it('same position id does not reapply setPosition', () => {
		const { rerender } = render(<Chessboard position={{ id: 1, position: 'start' }} />);

		mockBoard.setPosition.mockClear();

		// Same id, different payload — id wins over changed payload
		rerender(
			<Chessboard position={{ id: 1, position: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR' }} />
		);

		expect(mockBoard.setPosition).not.toHaveBeenCalled();
	});

	it('new position id applies setPosition once', () => {
		const { rerender } = render(<Chessboard position={{ id: 1, position: 'start' }} />);

		mockBoard.setPosition.mockClear();

		rerender(
			<Chessboard position={{ id: 2, position: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR' }} />
		);

		expect(mockBoard.setPosition).toHaveBeenCalledTimes(1);
		expect(mockBoard.setPosition).toHaveBeenCalledWith(
			'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR'
		);
	});

	it('same externalMove id does not reapply move', () => {
		const { rerender } = render(
			<Chessboard
				position={{ id: 1, position: 'start' }}
				externalMove={{ id: 1, move: { from: 'e2', to: 'e4' } }}
			/>
		);

		mockBoard.move.mockClear();

		// Same id, different payload — id wins over changed payload
		rerender(
			<Chessboard
				position={{ id: 1, position: 'start' }}
				externalMove={{ id: 1, move: { from: 'd7', to: 'd5' } }}
			/>
		);

		expect(mockBoard.move).not.toHaveBeenCalled();
	});

	it('new externalMove id applies move once', () => {
		const { rerender } = render(
			<Chessboard
				position={{ id: 1, position: 'start' }}
				externalMove={{ id: 1, move: { from: 'e2', to: 'e4' } }}
			/>
		);

		mockBoard.move.mockClear();

		const newMove = { from: 'd7' as const, to: 'd5' as const };
		rerender(
			<Chessboard position={{ id: 1, position: 'start' }} externalMove={{ id: 2, move: newMove }} />
		);

		expect(mockBoard.move).toHaveBeenCalledTimes(1);
		expect(mockBoard.move).toHaveBeenCalledWith(newMove);
	});

	it('orientation prop updates board orientation', () => {
		const { rerender } = render(
			<Chessboard position={{ id: 1, position: 'start' }} orientation="white" />
		);

		mockBoard.setOrientation.mockClear();

		rerender(<Chessboard position={{ id: 1, position: 'start' }} orientation="black" />);

		expect(mockBoard.setOrientation).toHaveBeenCalledWith('black');
	});

	it('movability prop updates board movability', () => {
		const { rerender } = render(
			<Chessboard position={{ id: 1, position: 'start' }} movability={{ mode: 'free' }} />
		);

		mockBoard.setMovability.mockClear();

		rerender(
			<Chessboard position={{ id: 1, position: 'start' }} movability={{ mode: 'disabled' }} />
		);

		expect(mockBoard.setMovability).toHaveBeenCalledWith({ mode: 'disabled' });
	});

	it('onUIMove uses the latest callback, not a stale callback', () => {
		const callback1 = vi.fn();
		const callback2 = vi.fn();

		const { rerender } = render(
			<Chessboard position={{ id: 1, position: 'start' }} onUIMove={callback1} />
		);

		// Get the registered handler from the first setOnUIMove call
		const registeredHandler = mockBoard.extensions.events.setOnUIMove.mock
			.calls[0][0] as OnUIMoveHandler;

		rerender(<Chessboard position={{ id: 1, position: 'start' }} onUIMove={callback2} />);

		// Simulate a UI move event through the registered handler
		const fakeMove = { from: 'e2', to: 'e4', piece: 'wP' } as unknown as MoveOutput;
		registeredHandler(fakeMove);

		expect(callback1).not.toHaveBeenCalled();
		expect(callback2).toHaveBeenCalledWith(fakeMove);
	});

	it('autoPromoteToQueen defaults to false and updates as prop changes', () => {
		const { rerender } = render(<Chessboard position={{ id: 1, position: 'start' }} />);

		expect(mockBoard.extensions.autoPromote.toQueen).toBe(false);

		rerender(<Chessboard position={{ id: 1, position: 'start' }} autoPromoteToQueen={true} />);

		expect(mockBoard.extensions.autoPromote.toQueen).toBe(true);

		rerender(<Chessboard position={{ id: 1, position: 'start' }} autoPromoteToQueen={false} />);

		expect(mockBoard.extensions.autoPromote.toQueen).toBe(false);
	});

	it('className and style are forwarded to the outer div', () => {
		const { container } = render(
			<Chessboard
				position={{ id: 1, position: 'start' }}
				className="my-board"
				style={{ width: '400px', height: '400px' }}
			/>
		);

		const div = container.firstElementChild as HTMLDivElement;
		expect(div.className).toBe('my-board');
		expect(div.style.width).toBe('400px');
		expect(div.style.height).toBe('400px');
	});
});
