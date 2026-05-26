import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

const DocumentCard = ({ document, onDelete, isModerator }) => {
  const navigate = () => {};
  
  return (
    <div className="card">
      <h3>{document.title}</h3>
      <p>{document.description}</p>
      <button onClick={() => navigate(`/documents/${document.id}`)}>Открыть</button>
      <button>Чат по документу</button>
      {isModerator && (
        <button onClick={() => onDelete(document.id)}>Удалить</button>
      )}
    </div>
  );
};

describe('DocumentCard', () => {
  const mockDocument = {
    id: '123',
    title: 'Тестовый документ',
    description: 'Описание тестового документа'
  };
  
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    render(
      <BrowserRouter>
        <DocumentCard 
          document={mockDocument} 
          onDelete={mockOnDelete} 
          isModerator={true}
        />
      </BrowserRouter>
    );
  });

  test('отображает название документа', () => {
    expect(screen.getByText('Тестовый документ')).toBeInTheDocument();
  });

  test('отображает описание документа', () => {
    expect(screen.getByText('Описание тестового документа')).toBeInTheDocument();
  });

  test('отображает кнопку "Открыть"', () => {
    expect(screen.getByText('Открыть')).toBeInTheDocument();
  });

  test('отображает кнопку "Чат по документу"', () => {
    expect(screen.getByText('Чат по документу')).toBeInTheDocument();
  });

  test('отображает кнопку "Удалить" для модератора', () => {
    expect(screen.getByText('Удалить')).toBeInTheDocument();
  });

  test('вызывает onDelete при клике на кнопку удаления', () => {
    fireEvent.click(screen.getByText('Удалить'));
    expect(mockOnDelete).toHaveBeenCalledWith('123');
  });
});