import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DocumentCard from './DocumentCard';

const mockDocument = {
  id: '1',
  title: 'Тестовый документ',
  description: 'Тестирование фронтенда'
};

const mockOnDelete = jest.fn();

describe('DocumentCard', () => {
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