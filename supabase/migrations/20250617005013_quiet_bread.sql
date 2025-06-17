/*
  # Seed Sample Data

  1. Sample Questions
    - Add diverse quiz questions across different categories and difficulties
    - Include questions for Science, History, Geography, Sports, Entertainment
    - Mix of easy, medium, and hard difficulty levels

  2. Demo Admin User
    - Create a demo admin profile for testing admin features
    - Email: admin@demo.com
    - Password will need to be set manually through Supabase Auth

  3. Sample Quiz Sessions
    - Add some sample quiz session data for demonstration
*/

-- Insert sample questions across different categories and difficulties
INSERT INTO questions (question_text, options, correct_answer, category, difficulty) VALUES
-- Science Questions (Easy)
('What is the chemical symbol for water?', ARRAY['H2O', 'CO2', 'NaCl', 'O2'], 0, 'Science', 'easy'),
('How many bones are in the adult human body?', ARRAY['206', '195', '220', '180'], 0, 'Science', 'easy'),
('What planet is known as the Red Planet?', ARRAY['Mars', 'Venus', 'Jupiter', 'Saturn'], 0, 'Science', 'easy'),

-- Science Questions (Medium)
('What is the powerhouse of the cell?', ARRAY['Mitochondria', 'Nucleus', 'Ribosome', 'Chloroplast'], 0, 'Science', 'medium'),
('What gas makes up approximately 78% of Earth''s atmosphere?', ARRAY['Nitrogen', 'Oxygen', 'Carbon Dioxide', 'Argon'], 0, 'Science', 'medium'),
('What is the speed of light in a vacuum?', ARRAY['299,792,458 m/s', '300,000,000 m/s', '186,000 miles/s', 'All of the above'], 3, 'Science', 'medium'),

-- Science Questions (Hard)
('What is the name of the theoretical boundary around a black hole?', ARRAY['Event Horizon', 'Photon Sphere', 'Ergosphere', 'Singularity'], 0, 'Science', 'hard'),
('Which element has the highest melting point?', ARRAY['Tungsten', 'Carbon', 'Rhenium', 'Osmium'], 0, 'Science', 'hard'),

-- History Questions (Easy)
('In which year did World War II end?', ARRAY['1945', '1944', '1946', '1943'], 0, 'History', 'easy'),
('Who was the first President of the United States?', ARRAY['George Washington', 'Thomas Jefferson', 'John Adams', 'Benjamin Franklin'], 0, 'History', 'easy'),
('Which ancient wonder of the world was located in Alexandria?', ARRAY['Lighthouse of Alexandria', 'Hanging Gardens', 'Colossus of Rhodes', 'Temple of Artemis'], 0, 'History', 'easy'),

-- History Questions (Medium)
('The Berlin Wall fell in which year?', ARRAY['1989', '1987', '1991', '1985'], 0, 'History', 'medium'),
('Who wrote "The Communist Manifesto"?', ARRAY['Karl Marx and Friedrich Engels', 'Vladimir Lenin', 'Leon Trotsky', 'Joseph Stalin'], 0, 'History', 'medium'),
('Which empire was ruled by Julius Caesar?', ARRAY['Roman Empire', 'Greek Empire', 'Persian Empire', 'Byzantine Empire'], 0, 'History', 'medium'),

-- History Questions (Hard)
('The Treaty of Westphalia ended which war?', ARRAY['Thirty Years'' War', 'Hundred Years'' War', 'Seven Years'' War', 'War of Spanish Succession'], 0, 'History', 'hard'),
('Who was the last Tsar of Russia?', ARRAY['Nicholas II', 'Alexander III', 'Nicholas I', 'Alexander II'], 0, 'History', 'hard'),

-- Geography Questions (Easy)
('What is the capital of France?', ARRAY['Paris', 'London', 'Berlin', 'Madrid'], 0, 'Geography', 'easy'),
('Which is the largest ocean on Earth?', ARRAY['Pacific Ocean', 'Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean'], 0, 'Geography', 'easy'),
('How many continents are there?', ARRAY['7', '6', '8', '5'], 0, 'Geography', 'easy'),

-- Geography Questions (Medium)
('Which river is the longest in the world?', ARRAY['Nile River', 'Amazon River', 'Yangtze River', 'Mississippi River'], 0, 'Geography', 'medium'),
('What is the smallest country in the world?', ARRAY['Vatican City', 'Monaco', 'San Marino', 'Liechtenstein'], 0, 'Geography', 'medium'),
('Which mountain range contains Mount Everest?', ARRAY['Himalayas', 'Andes', 'Rocky Mountains', 'Alps'], 0, 'Geography', 'medium'),

-- Geography Questions (Hard)
('What is the deepest point in the world''s oceans?', ARRAY['Mariana Trench', 'Puerto Rico Trench', 'Java Trench', 'Philippine Trench'], 0, 'Geography', 'hard'),
('Which African country has three capital cities?', ARRAY['South Africa', 'Nigeria', 'Kenya', 'Egypt'], 0, 'Geography', 'hard'),

-- Sports Questions (Easy)
('How many players are on a basketball team on the court at one time?', ARRAY['5', '6', '7', '4'], 0, 'Sports', 'easy'),
('In which sport would you perform a slam dunk?', ARRAY['Basketball', 'Volleyball', 'Tennis', 'Baseball'], 0, 'Sports', 'easy'),
('How often are the Summer Olympic Games held?', ARRAY['Every 4 years', 'Every 2 years', 'Every 3 years', 'Every 5 years'], 0, 'Sports', 'easy'),

-- Sports Questions (Medium)
('Which country has won the most FIFA World Cups?', ARRAY['Brazil', 'Germany', 'Argentina', 'Italy'], 0, 'Sports', 'medium'),
('In golf, what is the term for one stroke under par?', ARRAY['Birdie', 'Eagle', 'Bogey', 'Albatross'], 0, 'Sports', 'medium'),
('How long is a marathon race?', ARRAY['26.2 miles', '25 miles', '24.5 miles', '27 miles'], 0, 'Sports', 'medium'),

-- Sports Questions (Hard)
('Who holds the record for most home runs in a single MLB season?', ARRAY['Barry Bonds (73)', 'Mark McGwire (70)', 'Sammy Sosa (66)', 'Babe Ruth (60)'], 0, 'Sports', 'hard'),
('In which year were the first modern Olympic Games held?', ARRAY['1896', '1900', '1892', '1888'], 0, 'Sports', 'hard'),

-- Entertainment Questions (Easy)
('Who directed the movie "Jaws"?', ARRAY['Steven Spielberg', 'George Lucas', 'Martin Scorsese', 'Francis Ford Coppola'], 0, 'Entertainment', 'easy'),
('Which Disney movie features the song "Let It Go"?', ARRAY['Frozen', 'Moana', 'Tangled', 'The Little Mermaid'], 0, 'Entertainment', 'easy'),
('How many strings does a standard guitar have?', ARRAY['6', '5', '7', '4'], 0, 'Entertainment', 'easy'),

-- Entertainment Questions (Medium)
('Which actor played Jack Sparrow in Pirates of the Caribbean?', ARRAY['Johnny Depp', 'Orlando Bloom', 'Geoffrey Rush', 'Keira Knightley'], 0, 'Entertainment', 'medium'),
('What is the highest-grossing film of all time (as of 2023)?', ARRAY['Avatar (2009)', 'Avengers: Endgame', 'Titanic', 'Star Wars: The Force Awakens'], 0, 'Entertainment', 'medium'),
('Which TV series features the character Walter White?', ARRAY['Breaking Bad', 'Better Call Saul', 'The Sopranos', 'Dexter'], 0, 'Entertainment', 'medium'),

-- Entertainment Questions (Hard)
('Who composed the music for "The Lord of the Rings" film trilogy?', ARRAY['Howard Shore', 'John Williams', 'Hans Zimmer', 'Danny Elfman'], 0, 'Entertainment', 'hard'),
('Which film won the Academy Award for Best Picture in 1994?', ARRAY['Forrest Gump', 'The Shawshank Redemption', 'Pulp Fiction', 'The Lion King'], 0, 'Entertainment', 'hard');

-- Note: Admin user profile will be created automatically when an admin user signs up
-- The admin status can be set manually through the database or through the application
-- Demo admin credentials: admin@demo.com (password needs to be set through Supabase Auth)

-- Insert some sample quiz sessions (these will be linked to actual user IDs when users are created)
-- For now, we'll leave this commented out since we need actual user IDs
-- INSERT INTO quiz_sessions (user_id, score, total_questions, streak, time_taken) VALUES
-- ('user-id-here', 8, 10, 5, 120),
-- ('user-id-here', 6, 10, 3, 150);