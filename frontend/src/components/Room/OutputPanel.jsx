import { useState, useCallback } from 'react';
import { runCode } from '../../services/api';
import { useRoom } from '../../context/RoomContext';
import './OutputPanel.css';

/**
 * OutputPanel — shows execution output and stdin input.
 *
 * The Run button lives here so it's close to the output area.
 * Calls POST /api/run with { roomId, stdin } only.
 */
export default function OutputPanel({ output, roomId, isCompiling }) {
  const [stdin, setStdin] = useState('');
  const { dispatch } = useRoom();

  const handleRun = useCallback(async () => {
    if (isCompiling) return;

    dispatch({ type: 'SET_COMPILING', payload: true });

    try {
      await runCode(roomId, stdin);
      // Output will come through the WebSocket broadcast (OUTPUT_UPDATED)
    } catch (err) {
      dispatch({
        type: 'ERROR',
        payload: { message: err.message || 'Execution failed' },
      });
    } finally {
      dispatch({ type: 'SET_COMPILING', payload: false });
    }
  }, [roomId, stdin, isCompiling, dispatch]);

  const isCompilingState = output === 'Compiling...';
  const isEmpty = !output;

  return (
    <div className="output-panel">
      <div className="output-header">
        <div className="output-header-left">
          <span className="output-title">Output</span>
          {isCompilingState && <span className="spinner" />}
        </div>
        <button
          id="run-btn"
          className="btn btn-primary"
          onClick={handleRun}
          disabled={isCompiling}
        >
          {isCompiling ? 'Running...' : '▶ Run'}
        </button>
      </div>
      <div className="output-body">
        <div
          className={`output-content ${isCompilingState ? 'compiling' : ''} ${isEmpty ? 'empty' : ''}`}
        >
          {isEmpty ? 'Output will appear here after running your code' : output}
        </div>
        <div className="output-stdin">
          <div className="stdin-label">Stdin Input</div>
          <textarea
            id="stdin-input"
            className="stdin-textarea"
            placeholder="Enter input here..."
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
