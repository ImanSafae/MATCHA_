const db = require("./database");
const fs = require('fs');

function sanitizeFalsyToNull(value) {
  return value === 0 || value === NaN || value === undefined || value === ""
    ? null
    : value;
}

async function getUniqueFromTable(conditions, table) {
  try {
    const columns = Object.keys(conditions);
    const values = Object.values(conditions);

    const whereClauses = columns.map((col, index) => `${col} = $${index + 1}`).join(' AND ');
    const query = `SELECT * FROM ${table} WHERE ${whereClauses}`;

    const result = await db.query(query, values);
    return result.rows[0];
  } catch (error) {
    throw error;
  }
}
async function getDataByColumnName(column_name, value, database) {
  try {
    const query = `SELECT * FROM ${database} WHERE ${column_name} = $1`;
    const result = await db.query(query, [value]);

    if (result.rows.length > 0) {
      return result.rows[0];
    } else {
      return null;
    }
  } catch (error) {
    throw error;
  }
}

async function getAllDataByColumnName(column_name, value, database) {
  try {
    const query = `SELECT * FROM ${database} WHERE ${column_name} = $1`;
    const result = await db.query(query, [value]);

    if (result.rows.length > 0) {
      return result.rows;
    } else {
      return null;
    }
  } catch (error) {
    throw error;
  }
}

async function getUsernameByUserId(user_id) {
  try {
    const query = `SELECT username FROM users WHERE id = $1`;
    const result = await db.query(query, [user_id]);

    if (result.rows.length > 0) {
      return result.rows[0].username;
    }
    return null;
  } catch (error) {
    throw error;
  }
}

async function getUserIdByUsername(username) {
  try {
    const query = `SELECT id FROM users WHERE username = $1`;
    const result = await db.query(query, [username]);

    if (result.rows.length > 0) {
      return result.rows[0].id;
    }
    return null;
  } catch (error) {
    throw error;
  }
}

async function getAllTagNames() {
  try {
    const res = await db.query('SELECT name FROM tags;');
    const tagNames = res.rows.map(row => row.name);
    return tagNames;
  } catch (error) {
    throw error;
  }
}

async function checkMatch(user_1, user_2) {
  try {
    const query = `SELECT matched FROM users WHERE id = $1`;
    const result_1 = await db.query(query, [user_1]);
    const result_2 = await db.query(query, [user_2]);

    if (
      result_1.rows[0].matched.includes(user_2) &&
      result_2.rows[0].matched.includes(user_1)
    ) {
      return true;
    }
    return false;
  } catch (error) {
    throw error;
  }
}

async function getMultiFromTable(conditions, table) {
  try {
    const columns = Object.keys(conditions);
    const values = Object.values(conditions);

    const whereClauses = columns.map((col, index) => `${col} = $${index + 1}`).join(' AND ');
    const query = `SELECT * FROM ${table} WHERE ${whereClauses}`;

    const result = await db.query(query, values);
    return result.rows;
  } catch (error) {
    throw error;
  }
}

async function getMultiFromTableWithOrder(conditions, table, orderByColumn, order = 'ASC') {
  try {
    const columns = Object.keys(conditions);
    const values = Object.values(conditions);

    const whereClauses = columns.map((col, index) => `${col} = $${index + 1}`).join(' AND ');
    const query = `SELECT * FROM ${table} WHERE ${whereClauses} ORDER BY ${orderByColumn} ${order}`;

    const result = await db.query(query, values);
    return result.rows;
  } catch (error) {
    throw error;
  }
}

async function postPendingUser(data, hashedPassword, uuid) {
  try {
    await db.query(
      `INSERT INTO pending_users
            (uuid, username, email, password, first_name, last_name, date_of_birth, gender, sexual_pref, biography)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        uuid,
        data.username,
        data.email,
        hashedPassword,
        data.first_name,
        data.last_name,
        data.date_of_birth,
        data.gender,
        sanitizeFalsyToNull(data.sexual_pref),
        sanitizeFalsyToNull(data.biography),
      ]
    );
  } catch (error) {
    throw error;
  }
}

async function postUser(data) {
  try {
    await db.query(
      `INSERT INTO users
            (username, email, password, first_name, last_name, date_of_birth, gender, sexual_pref, biography)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        data.username,
        data.email,
        data.password,
        data.first_name,
        data.last_name,
        data.date_of_birth,
        data.gender,
        sanitizeFalsyToNull(data.sexual_pref),
        sanitizeFalsyToNull(data.biography),
      ]
    );
  } catch (error) {
    throw error;
  }
}

async function getTagsName(user_id) {
  try {
    const query = `
            SELECT t.name
            FROM tags t
            INNER JOIN user_tags ut ON t.id = ut.tag_id
            WHERE ut.user_id = $1
        `;

    const result = await db.query(query, [user_id]);
    return result.rows.map(row => row.name);
  } catch (error) {
    throw error;
  }
}

async function deleteTags(user_id, tagToSuppr) {
  try {
    const query = `
        DELETE FROM user_tags
        WHERE user_id = $1
        AND tag_id IN (
          SELECT id FROM tags WHERE name = ANY($2)
        )
      `;
    await db.query(query, [user_id, tagToSuppr]);
  } catch (error) {
    throw error;
  }
}

async function addTags(user_id, tagToAdd) {
  try {
    const query = `
        INSERT INTO user_tags (user_id, tag_id)
        SELECT $1, id FROM tags WHERE name = ANY($2)
        ON CONFLICT DO NOTHING
      `;
    await db.query(query, [user_id, tagToAdd]);
  } catch (error) {
    throw error;
  }
}

async function postTags(user_id, newTags) {
  try {
    const oldTags = await getTagsName(user_id);
    const tagToAdd = newTags.filter(tag => !oldTags.includes(tag));
    const tagToSuppr = oldTags.filter(tag => !newTags.includes(tag));
    await deleteTags(user_id, tagToSuppr);
    await addTags(user_id, tagToAdd);
  } catch (error) {
    throw error;
  }
}

async function updateLocation(user_id, lat, lon) {
  try {
    const query = `
      UPDATE users
      SET location = ST_SetSRID(ST_MakePoint($3, $2), 4326)
      WHERE id = $1
      `;
    await db.query(query, [user_id, lat, lon]);
  } catch (error) {
    throw error;
  }
}

async function getUserLocation(user_id) {
  try {
    const query = `
      SELECT 
        ST_Y(location::geometry) AS latitude,
        ST_X(location::geometry) AS longitude
      FROM 
        users
      WHERE id = $1;
    `;
    await db.query(query, [user_id]);
    const result = await db.query(query, [user_id]);
    if (result.rows.length) {
      return result.rows[0];
    } else {
      // console.log('User not found.');
      return null;
    }
  } catch (err) {
    // console.error('Error executing query', err.stack);
  }
}

async function getFullUser(user_id) {
  try {
    const query = `
    SELECT 
      u.id,
      u.username,
      u.email,
      u.first_name,
      u.last_name,
      u.gender,
      u.date_of_birth,
      u.sexual_pref,
      u.biography,
      u.fame_rating,
      u.last_active,
      u.matched,
      u.blocked,
      ST_Y(u.location::geometry) AS latitude,
      ST_X(u.location::geometry) AS longitude,
      COALESCE(likes_count.nb_likes, 0) AS nb_likes,
      COALESCE(views_count.nb_views, 0) AS nb_views,
      COALESCE(
        (SELECT json_agg(p)
         FROM (
             SELECT id, pict_type, path, created_at
             FROM picture
             WHERE user_id = u.id
             ORDER BY created_at ASC
         ) p
        ), '[]') AS pictures,
      COALESCE(
        (SELECT json_agg(t.name)
          FROM tags t
          INNER JOIN user_tags ut ON t.id = ut.tag_id
          WHERE ut.user_id = u.id
        ), '[]') AS tags,
      (SELECT json_agg(name) FROM tags) AS all_tags  
    FROM 
        users u
    LEFT JOIN (
      SELECT 
          liked_id,
          COUNT(*) AS nb_likes
      FROM 
          likes
      GROUP BY 
          liked_id
    ) AS likes_count ON u.id = likes_count.liked_id
    LEFT JOIN (
      SELECT 
          viewed_id,
          COUNT(*) AS nb_views
      FROM 
          views
      GROUP BY 
          viewed_id
    ) AS views_count ON u.id = views_count.viewed_id
    WHERE 
        u.id = $1;
    `;
    await db.query(query, [user_id]);
    const result = await db.query(query, [user_id]);
    if (result.rows.length) {
      return result.rows[0];
    } else {
      // console.log('User not found.');
      return null;
    }
  } catch (err) {
    // console.error('Error executing query', err.stack);
  }
}

async function getUsersAccordingToGenderAndSexualPref(user_id) {
  try {
    const query = `
    WITH current_user_infos AS (
      SELECT id, gender, sexual_pref, location
      FROM users
      WHERE id = $1
    ),
    user_distances AS (
        SELECT 
            u.id,
            u.first_name,
            u.last_name,
            DATE_PART('year', AGE(u.date_of_birth)) AS age,
            u.fame_rating,
            p.path AS profile_pict,
            ST_Distance(u.location, (SELECT location FROM current_user_infos)) AS distance,
            ARRAY_AGG(t.name) FILTER (WHERE t.name IS NOT NULL) AS common_tags
        FROM users u
        LEFT JOIN picture p ON p.user_id = u.id AND p.pict_type = 'PROFILE'
        LEFT JOIN user_tags ut ON ut.user_id = u.id
        LEFT JOIN user_tags cut ON cut.user_id = (SELECT id FROM current_user_infos)
        LEFT JOIN tags t ON t.id = ut.tag_id AND ut.tag_id = cut.tag_id
        WHERE 
            u.id != (SELECT id FROM current_user_infos) AND
            (
              ((SELECT gender FROM current_user_infos) = 'man' AND
                (
                  (
                    (SELECT sexual_pref FROM current_user_infos) = 'heterosexual' AND
                    u.gender = 'woman' AND
                    (u.sexual_pref = 'heterosexual' OR u.sexual_pref = 'bisexual')
                  ) OR
                  (
                    (SELECT sexual_pref FROM current_user_infos) = 'bisexual' AND
                    (
                      (u.gender = 'woman' AND (u.sexual_pref = 'heterosexual' OR u.sexual_pref = 'bisexual')) OR
                      (u.gender = 'man' AND (u.sexual_pref = 'bisexual' OR u.sexual_pref = 'homosexual'))
                    )
                  ) OR
                  (
                    (SELECT sexual_pref FROM current_user_infos) = 'homosexual' AND
                    u.gender = 'man' AND
                    (u.sexual_pref = 'homosexual' OR u.sexual_pref = 'bisexual')
                  )
                )
              ) OR
              ((SELECT gender FROM current_user_infos) = 'woman' AND
                (
                  (
                    (SELECT sexual_pref FROM current_user_infos) = 'heterosexual' AND
                    u.gender = 'man' AND
                    (u.sexual_pref = 'heterosexual' OR u.sexual_pref = 'bisexual')
                  ) OR
                  (
                    (SELECT sexual_pref FROM current_user_infos) = 'bisexual' AND
                    (
                      (u.gender = 'man' AND (u.sexual_pref = 'heterosexual' OR u.sexual_pref = 'bisexual')) OR
                      (u.gender = 'woman' AND (u.sexual_pref = 'bisexual' OR u.sexual_pref = 'homosexual'))
                    )
                  ) OR
                  (
                    (SELECT sexual_pref FROM current_user_infos) = 'homosexual' AND
                    u.gender = 'woman' AND
                    (u.sexual_pref = 'homosexual' OR u.sexual_pref = 'bisexual')
                  )
                )
              )
            )
        GROUP BY u.id, u.first_name, u.last_name, u.date_of_birth, u.fame_rating, p.path
    )
    SELECT * FROM user_distances
    ORDER BY distance;  
    `;

    await db.query(query, [user_id]);
    const result = await db.query(query, [user_id]);
    if (result.rows.length) {
      return result.rows;
    } else {
      // console.log('No user corresponding to these criterias found.');
      return null;
    }
  } catch(error) {
    // console.error('Error executing query', error.stack);
  }
}

async function getSuggestedUsers(user_id) {
  try {
    const query = `
    WITH current_user_infos AS (
      SELECT id, gender, sexual_pref, location, fame_rating
      FROM users
      WHERE id = $1
    ),
    user_distances AS (
        SELECT 
            u.id,
            u.first_name,
            u.last_name,
            DATE_PART('year', AGE(u.date_of_birth)) AS age,
            u.fame_rating,
            p.path AS profile_pict,
            ST_Distance(u.location, (SELECT location FROM current_user_infos)) AS distance,
            ARRAY_AGG(t.name) FILTER (WHERE t.name IS NOT NULL) AS common_tags
        FROM users u
        LEFT JOIN picture p ON p.user_id = u.id AND p.pict_type = 'PROFILE'
        LEFT JOIN user_tags ut ON ut.user_id = u.id
        LEFT JOIN user_tags cut ON cut.user_id = (SELECT id FROM current_user_infos)
        LEFT JOIN tags t ON t.id = ut.tag_id AND ut.tag_id = cut.tag_id
        WHERE 
            u.id != (SELECT id FROM current_user_infos) AND
            ST_Distance(u.location, (SELECT location FROM current_user_infos)) <= 500000 AND -- Distance <= 500 km
            ABS(u.fame_rating - (SELECT fame_rating FROM current_user_infos)) <= 1 AND -- Fame rating difference <= 1
            (
              ((SELECT gender FROM current_user_infos) = 'man' AND
                (
                  (
                    (SELECT sexual_pref FROM current_user_infos) = 'heterosexual' AND
                    u.gender = 'woman' AND
                    (u.sexual_pref = 'heterosexual' OR u.sexual_pref = 'bisexual')
                  ) OR
                  (
                    (SELECT sexual_pref FROM current_user_infos) = 'bisexual' AND
                    (
                      (u.gender = 'woman' AND (u.sexual_pref = 'heterosexual' OR u.sexual_pref = 'bisexual')) OR
                      (u.gender = 'man' AND (u.sexual_pref = 'bisexual' OR u.sexual_pref = 'homosexual'))
                    )
                  ) OR
                  (
                    (SELECT sexual_pref FROM current_user_infos) = 'homosexual' AND
                    u.gender = 'man' AND
                    (u.sexual_pref = 'homosexual' OR u.sexual_pref = 'bisexual')
                  )
                )
              ) OR
              ((SELECT gender FROM current_user_infos) = 'woman' AND
                (
                  (
                    (SELECT sexual_pref FROM current_user_infos) = 'heterosexual' AND
                    u.gender = 'man' AND
                    (u.sexual_pref = 'heterosexual' OR u.sexual_pref = 'bisexual')
                  ) OR
                  (
                    (SELECT sexual_pref FROM current_user_infos) = 'bisexual' AND
                    (
                      (u.gender = 'man' AND (u.sexual_pref = 'heterosexual' OR u.sexual_pref = 'bisexual')) OR
                      (u.gender = 'woman' AND (u.sexual_pref = 'bisexual' OR u.sexual_pref = 'homosexual'))
                    )
                  ) OR
                  (
                    (SELECT sexual_pref FROM current_user_infos) = 'homosexual' AND
                    u.gender = 'woman' AND
                    (u.sexual_pref = 'homosexual' OR u.sexual_pref = 'bisexual')
                  )
                )
              )
            )
        GROUP BY u.id, u.first_name, u.last_name, u.date_of_birth, u.fame_rating, p.path
        HAVING ARRAY_LENGTH(ARRAY_AGG(t.name) FILTER (WHERE t.name IS NOT NULL), 1) > 0 -- At least one common tag
    )
    SELECT * FROM user_distances
    ORDER BY distance;    
    `;

    await db.query(query, [user_id]);
    const result = await db.query(query, [user_id]);
    if (result.rows.length) {
      return result.rows;
    } else {
      // console.log('No user corresponding to these criterias found.');
      return null;
    }
  } catch(error) {
    // console.error('Error executing query', error.stack);
  }
}

async function postView(viewer_id, viewed_id) {
  try {
    await db.query(
      `INSERT INTO views (viewer_id, viewed_id) 
      VALUES ($1, $2)`,
      [viewer_id, viewed_id]
    );
  } catch (error) {
    throw error;
  }
}

async function postLike(liker_id, liked_id) {
  try {
    await db.query(
      `INSERT INTO likes (liker_id, liked_id) 
      VALUES ($1, $2)`,
      [liker_id, liked_id]
    );
  } catch (error) {
    throw error;
  }
}

async function deleteLike(liker_id, liked_id) {
  try {
    await db.query(
      `DELETE FROM likes 
      WHERE liker_id = $1 AND liked_id = $2;`,
      [liker_id, liked_id]
    );
  } catch (error) {
    throw error;
  }
}

async function postUuid(uuid, user_id, detail = null) {
  try {
    if (!detail) {
      await db.query(
        `INSERT INTO uuid
                (uuid, user_id)
                VALUES ($1, $2)`,
        [uuid, user_id]
      );
    } else {
      await db.query(
        `INSERT INTO uuid
                (uuid, user_id, detail)
                VALUES ($1, $2, $3)`,
        [uuid, user_id, detail]
      );
    }
  } catch (error) {
    throw error;
  }
}

async function deleteInputFromTable(conditions, table) {
  try {
    const columns = Object.keys(conditions);
    const values = Object.values(conditions);

    const whereClauses = columns.map((col, index) => `${col} = $${index + 1}`).join(' AND ');
    const query = `DELETE FROM ${table} WHERE ${whereClauses}`;

    await db.query(query, values);
  } catch (error) {
    throw error;
  }
}

async function deleteMultipleRows(column, values, table) {
  try {
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
    const query = `DELETE FROM ${table} WHERE ${column} IN (${placeholders})`;
    await db.query(query, values);
  } catch (error) {
    throw error;
  }
}


async function updateInputsInTable(updates, condition_column, condition_value, table) {
  try {
    const setClause = Object.keys(updates).map((column, index) => `${column} = $${index + 1}`).join(', ');
    const values = Object.values(updates);
    values.push(condition_value);

    const query = `UPDATE ${table} SET ${setClause} WHERE ${condition_column} = $${values.length}`;

    await db.query(query, values);
  } catch (error) {
    throw error;
  }
}

async function getUserTags(userId) {
  try {
    const query = `
            SELECT t.name
            FROM tags t
            INNER JOIN user_tags ut ON t.id = ut.tag_id
            WHERE ut.user_id = $1
        `;
    const result = await db.query(query, [userId]);
    const tags = result.rows.map(row => row.name);
    return tags;
  } catch (err) {
    // console.error('Error executing query', err.stack);
    throw err;
  }
}

async function getViewedProfiles(userId) {
  try {
    const query = `
      SELECT
        u.id, 
        u.first_name,
        u.last_name,
        v.timestamp
      FROM 
        views v
      JOIN 
        users u ON v.viewed_id = u.id
      WHERE 
        v.viewer_id = $1
      ORDER BY 
        v.timestamp DESC;
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  } catch (err) {
    // console.error('Error executing query', err.stack);
    throw err;
  }
}

async function getViewers(userId) {
  try {
    const query = `
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        v.timestamp
      FROM 
        views v
      JOIN 
        users u ON v.viewer_id = u.id
      WHERE 
        v.viewed_id = $1
      ORDER BY 
        v.timestamp DESC;
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  } catch (err) {
    // console.error('Error executing query', err.stack);
    throw err;
  }
}
async function getLikers(userId) {
  try {
    const query = `
      SELECT
        u.id, 
        u.first_name,
        u.last_name,
        v.timestamp
      FROM 
        likes v
      JOIN 
        users u ON v.liker_id = u.id
      WHERE 
        v.liked_id = $1
      ORDER BY 
        v.timestamp DESC;
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  } catch (err) {
    // console.error('Error executing query', err.stack);
    throw err;
  }
}

async function getLikedProfiles(userId) {
  try {
    const query = `
      SELECT
        u.id, 
        u.first_name,
        u.last_name,
        v.timestamp
      FROM 
        likes v
      JOIN 
        users u ON v.liked_id = u.id
      WHERE 
        v.liker_id = $1
      ORDER BY 
        v.timestamp DESC;
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  } catch (err) {
    // console.error('Error executing query', err.stack);
    throw err;
  }
}

async function getLikedIds(userId) {
  try {
    const query = `SELECT liked_id FROM likes WHERE liker_id = $1`;
    const result = await db.query(query, [userId]);
    return result.rows.map(row => row.liked_id);
  }
  catch (error) {
    // console.error('Error executing query', error.stack);
    throw error;
  }
}

async function postPicturesPath(files, userId) {
  let isNewProfile = false;
  const client = await db.query('BEGIN');
  try {
    for (let file of files) {
      if (file.fieldname == 'PROFILE') {
        isNewProfile = true;
        const profile_pic = await getUniqueFromTable({ "user_id": userId, "pict_type": 'PROFILE' }, "picture");
        if (profile_pic) {
          const oldPath = (profile_pic.path).replace('http://localhost:3000', '');
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
          await deleteInputFromTable({ "user_id": userId, "pict_type": 'PROFILE' }, "picture")
        }
      }
    }

    isProfile = await getUniqueFromTable({ "pict_type": "PROFILE", "user_id": userId }, "picture");
    if (isProfile || isNewProfile) {
      let insertQuery = 'INSERT INTO picture (user_id, pict_type, path) VALUES ';
      const insertValues = [];
      let paramIndex = 1;

      files.forEach((file) => {
        const pict_type = file.fieldname;
        const filePath = "http://localhost:3000/" + file.path;
        insertQuery += `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}),`;
        insertValues.push(userId, pict_type, filePath);
        paramIndex += 3;
      });

      // remove final ','
      insertQuery = insertQuery.slice(0, -1);
      await db.query(insertQuery, insertValues);
      await db.query('COMMIT');
    }
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}

async function getConversationIdByUserIds(user_id, recipient_id) {
  try {
    const query = `
            SELECT * FROM conversations 
            WHERE (user_1 = $1 AND user_2 = $2) 
            OR (user_1 = $2 AND user_2 = $1)
        `;
    const result = await db.query(query, [user_id, recipient_id]);

    if (result.rows.length > 0) {
      return result.rows[0].id;
    } else {
      return null;
    }
  } catch (error) {
    throw error;
  }
}

async function getConversationsSummariesByUserId(user_id) {
  const query = `
        WITH UserConversations AS (
            SELECT
                id,
                user_1,
                user_2,
                messages
            FROM
                conversations
            WHERE
                user_1 = $1 OR user_2 = $1
        ),
        LatestMessages AS (
            SELECT
                id,
                user_1,
                user_2,
                messages[array_length(messages, 1)] AS latest_message
            FROM
                UserConversations
        )
        SELECT
            id,
            user_1,
            user_2,
            latest_message
        FROM
            LatestMessages;
    `;
  try {
    const result = await db.query(query, [user_id]);
    return result.rows;
  } catch (error) {
    throw error;
  }
}

async function newMessageInConversation(conversationId, newMessage) {
  try {
    // console.log("adding new message to conv:", newMessage);
    const query = `UPDATE conversations SET messages = array_append(messages, $1::jsonb) WHERE id = $2`;

    await db.query(query, [newMessage, conversationId]);
  } catch (error) {
    throw error;
  }
}

async function addNotification(userId, type, senderId, timestamp) {
  try {
    const query = `INSERT INTO notifications (user_id, type, sender_id, timestamp ) VALUES ($1, $2, $3, $4) RETURNING id`;
    const result = await db.query(query, [userId, type, senderId, timestamp]);

    return result.rows[0];
  } catch (error) {
    throw error;
  }
}

async function createConversation(user_1, user_2) {
  try {
    const query = `INSERT INTO conversations (user_1, user_2) VALUES ($1, $2) RETURNING id`;
    const result = await db.query(query, [user_1, user_2]);
    return result.rows[0].id;
  } catch (error) {
    throw error;
  }
}

async function getConversationUsersByConversationId(conversationId) {
  try {
    const query = `SELECT user_1, user_2 FROM conversations WHERE id = $1`;
    const result = await db.query(query, [conversationId]);
    return result.rows[0];
  } catch (error) {
    throw error;
  }
}

async function getConversationContentById(conversationId) {
  try {
    const query = `SELECT * FROM conversations WHERE id = $1`;
    const result = await db.query(query, [conversationId]);
    return result.rows[0];
  } catch (error) {
    throw error;
  }
}

async function getUserProfileData(userId) {
  try {
    const query = `SELECT
      u.id,
      u.username, 
      u.first_name, 
      u.last_name, 
      u.gender, 
      u.date_of_birth, 
      u.sexual_pref, 
      u.biography,
      u.fame_rating,
      u.last_active,
      ST_Y(u.location::geometry) AS latitude,
      ST_X(u.location::geometry) AS longitude,
      COALESCE(likes_count.nb_likes, 0) AS nb_likes,
      COALESCE(views_count.nb_views, 0) AS nb_views,
      COALESCE(
        (SELECT json_agg(p)
         FROM (
             SELECT id, pict_type, path, created_at
             FROM picture
             WHERE user_id = u.id
             ORDER BY created_at ASC
         ) p
        ), '[]') AS pictures,
      COALESCE(
        (SELECT json_agg(t.name)
          FROM tags t
          INNER JOIN user_tags ut ON t.id = ut.tag_id
          WHERE ut.user_id = u.id
        ), '[]') AS tags,
      (SELECT json_agg(name) FROM tags) AS all_tags  
    FROM 
        users u
    LEFT JOIN (
      SELECT 
          liked_id,
          COUNT(*) AS nb_likes
      FROM 
          likes
      GROUP BY 
          liked_id
    ) AS likes_count ON u.id = likes_count.liked_id
    LEFT JOIN (
      SELECT 
          viewed_id,
          COUNT(*) AS nb_views
      FROM 
          views
      GROUP BY 
          viewed_id
    ) AS views_count ON u.id = views_count.viewed_id
    WHERE 
        u.id = $1;
    `;
    const result = await db.query(query, [userId]);
    return result.rows[0];
  } catch (error) {
    // console.error("Error in getUserProfileData:", error);
    throw error;
  }
}

// async function incrementProfileLikes(userId) {
//   try {
//     const query = `UPDATE users SET nb_likes = nb_likes + 1 WHERE id = $1`;
//     await db.query(query, [userId]);
//   } catch (error) {
//     // console.error("Error in incrementProfilLikes:", error);
//     throw error;
//   }
// }

async function updateLikedProfiles(userId, likedId, timestamp, add) {
  try {
    const checkQuery = `SELECT * FROM likes WHERE liker_id = $1 AND liked_id = $2`;
    const checkResult = await db.query(checkQuery, [userId, likedId]);
    const likedProfiles = checkResult.rows[0];
    if (
      (add && likedProfiles) ||
      (!add && !likedProfiles)
    ) {
      // console.error("likedProfiles:", likedProfiles);
      return null;
    }

    let query;
    const params = [userId, likedId];
    if (add) {
      // query = `UPDATE users SET liked_profiles = array_append(liked_profiles, $1) WHERE id = $2`;
      query = `INSERT INTO likes (liker_id, liked_id, timestamp) VALUES ($1, $2, $3)`;
      params.push(timestamp);
    } else {
      // query = `UPDATE users SET liked_profiles = array_remove(liked_profiles, $1) WHERE id = $2`;
      query = `DELETE FROM likes WHERE liker_id = $1 AND liked_id = $2;`;
    }
    const result = await db.query(query, params);
    return result;
  } catch (error) {
    // console.error("Error in updateLikedProfiles:", error);
    throw error;
  }
}

async function decrementProfileLikes(userId) {
  try {
    const query = `UPDATE users SET nb_likes = nb_likes - 1 WHERE id = $1`;
    await db.query(query, [userId]);
  } catch (error) {
    // console.error("Error in decrementProfileLikes:", error);
    throw error;
  }
}

async function addMatch(user_1, user_2) {
  try {
    const query = `UPDATE users SET matched = array_append(matched, $1) WHERE id = $2`;
    await db.query(query, [user_2, user_1]);
    await db.query(query, [user_1, user_2]);
  } catch (error) {
    // console.error("Error in addMatch:", error);
    throw error;
  }
}

async function removeMatch(user_1, user_2) {
  try {
    const query = `UPDATE users SET matched = array_remove(matched, $1) WHERE id = $2`;
    await db.query(query, [user_2, user_1]);
    await db.query(query, [user_1, user_2]);
  } catch (error) {
    // console.error("Error in removeMatch:", error);
    throw error;
  }
}

async function addBlockedUser(user_id, blocked_id) {
  try {
    const query = `UPDATE users SET blocked = array_append(blocked, $1) WHERE id = $2`;
    await db.query(query, [blocked_id, user_id]);
  } catch (error) {
    // console.error("Error in addBlockedUser:", error);
    throw error;
  }
}

async function removeBlockedUser(user_id, blocked_id) {
  try {
    const query = `UPDATE users SET blocked = array_remove(blocked, $1) WHERE id = $2`;
    await db.query(query, [blocked_id, user_id]);
  } catch (error) {
    // console.error("Error in removeBlockedUser:", error);
    throw error;
  }
}

async function updateLastActive(userId, date) {
  try {
    const query = `UPDATE users SET last_active = $1 WHERE id = $2`;
    await db.query(query, [date, userId]);
  } catch (error) {
    throw error;
  }
}

async function getMatchingProfiles(id, genders, location) {
  try {

    // console.log("browsing parameters:", genders, location);

    let query_1 = ` (
    SELECT * 
    FROM users 
    WHERE location = $2 
    AND id != $1`;
    let query_2 = `UNION ALL
(
    SELECT * 
    FROM users 
    WHERE id != $1
    AND location != $2 `;

    const params = [id, location];

    if (genders !== "both") {
      const genderQuery = ` AND gender = $3`;
      query_1 += genderQuery;
      query_2 += genderQuery;
      params.push(genders);
    }

    query_1 += ` ORDER BY ARRAY_LENGTH(interests, 1) DESC, fame_rating DESC 
    LIMIT 50)`;
    query_2 += ` ORDER BY ARRAY_LENGTH(interests, 1) DESC, fame_rating DESC 
    LIMIT 50) LIMIT 50;`;
    const query = query_1 + query_2;
    // console.log("query in getMatchingProfiles:", query);
    const result = await db.query(query, params);
    return result.rows;
  } catch (error) {
    throw error;
  }
}

async function searchProfiles({
  userId,
  tags = [],
  minAge = null,
  maxAge = null,
  minFameRating = 0,
  location = null,
}) {
  try {

    // console.log("location sent:", location);
    const initialInfo = `
  WITH current_user_infos AS (
    SELECT id, gender, sexual_pref, location, blocked
    FROM users
    WHERE id = $1
  ),
  user_distances AS (
    SELECT 
      u.id,
      u.first_name,
      u.last_name,
      DATE_PART('year', AGE(u.date_of_birth)) AS age,
      u.fame_rating,
      p.path AS profile_pict,
      ST_Distance(u.location, (SELECT location FROM current_user_infos)) AS distance,
      ARRAY_AGG(DISTINCT t.name) AS tags
    FROM users u
    LEFT JOIN picture p ON p.user_id = u.id AND p.pict_type = 'PROFILE'
    LEFT JOIN user_tags ut ON ut.user_id = u.id
    LEFT JOIN tags t ON ut.tag_id = t.id
    WHERE 
      u.id != $1
      AND NOT (u.id = ANY((SELECT unnest(blocked) FROM current_user_infos)))
      AND NOT ($1 = ANY(u.blocked))
      AND (
              ((SELECT gender FROM current_user_infos) = 'man' AND
                (
                  (
                    (SELECT sexual_pref FROM current_user_infos) = 'heterosexual' AND
                    u.gender = 'woman' AND
                    (u.sexual_pref = 'heterosexual' OR u.sexual_pref = 'bisexual')
                  ) OR
                  (
                    (SELECT sexual_pref FROM current_user_infos) = 'bisexual' AND
                    (
                      (u.gender = 'woman' AND (u.sexual_pref = 'heterosexual' OR u.sexual_pref = 'bisexual')) OR
                      (u.gender = 'man' AND (u.sexual_pref = 'bisexual' OR u.sexual_pref = 'homosexual'))
                    )
                  ) OR
                  (
                    (SELECT sexual_pref FROM current_user_infos) = 'homosexual' AND
                    u.gender = 'man' AND
                    (u.sexual_pref = 'homosexual' OR u.sexual_pref = 'bisexual')
                  )
                )
              ) OR
              ((SELECT gender FROM current_user_infos) = 'woman' AND
                (
                  (
                    (SELECT sexual_pref FROM current_user_infos) = 'heterosexual' AND
                    u.gender = 'man' AND
                    (u.sexual_pref = 'heterosexual' OR u.sexual_pref = 'bisexual')
                  ) OR
                  (
                    (SELECT sexual_pref FROM current_user_infos) = 'bisexual' AND
                    (
                      (u.gender = 'man' AND (u.sexual_pref = 'heterosexual' OR u.sexual_pref = 'bisexual')) OR
                      (u.gender = 'woman' AND (u.sexual_pref = 'bisexual' OR u.sexual_pref = 'homosexual'))
                    )
                  ) OR
                  (
                    (SELECT sexual_pref FROM current_user_infos) = 'homosexual' AND
                    u.gender = 'woman' AND
                    (u.sexual_pref = 'homosexual' OR u.sexual_pref = 'bisexual')
                  )
                )
              )
            )
  `;

    let params = [userId];
    let currentIndex = 2; // Le prochain paramètre commence à 2 après `currentUserId`
    let whereClause = "";

    // Ajout des tags si spécifiés
    if (tags.length > 0) {
      const tagsClause = `
    AND u.id IN (
      SELECT ut.user_id
      FROM user_tags ut
      JOIN tags t ON ut.tag_id = t.id
      WHERE t.name IN (${tags.map(() => `$${currentIndex++}`).join(", ")})
      GROUP BY ut.user_id
      HAVING COUNT(DISTINCT t.name) = ${tags.length}
    )
  `;
      whereClause += ` ${tagsClause}`;
      params.push(...tags);
    }

    // Ajout de la localisation si spécifiée
    if (location) {
      const locationClause = `AND ST_DWithin(u.location, ST_SetSRID(ST_MakePoint($${currentIndex++}, $${currentIndex++}), 4326), 800000)`; // Distance fixe de 10 km
      whereClause += ` ${locationClause}`;
      params.push(location.lon);
      params.push(location.lat);
    }

    // Ajout de la tranche d'âge si nécessaire
    if (minAge !== 18 || maxAge !== 120) {
      const ageClause = `AND DATE_PART('year', AGE(u.date_of_birth)) BETWEEN $${currentIndex++} AND $${currentIndex++}`;
      whereClause += ` ${ageClause}`;
      params.push(minAge, maxAge);
    }

    // Ajout du fame rating si nécessaire
    if (minFameRating > 0) {
      const fameRatingClause = `AND u.fame_rating >= $${currentIndex++}`;
      whereClause += ` ${fameRatingClause}`;
      params.push(minFameRating);
    }

    // Fin de la requête
    const queryEnd = `
  GROUP BY u.id, u.first_name, u.last_name, u.date_of_birth, u.fame_rating, p.path
)
SELECT * FROM user_distances
ORDER BY distance;
`;

    // Finalisation de la requête SQL
    const finalQuery = initialInfo + whereClause + queryEnd;

    // console.log("finalQuery:", finalQuery);
    // console.log("params:", params);

    // Exécution de la requête
    const result = await db.query(finalQuery, params);
    return result.rows;
  } catch (error) {
    // console.error("Error executing query:", error);
    throw error;
  }
}




async function updateFameRating(userId, coefficient) {
  try {
    const query = `
        UPDATE users 
        SET fame_rating = LEAST(5, GREATEST(0, fame_rating * $1))
        WHERE id = $2 
        RETURNING fame_rating;
    `;
    const result = await db.query(query, [coefficient, userId]);
    return result.rows[0].fame_rating;
  }
  catch (error) {
    // console.error('Error executing query', error);
    throw error;
  }
}

async function markNotificationAsRead(notifId) {
  try {
    const query = `UPDATE notifications SET read = true WHERE id = $1`;
    await db.query(query, [notifId]);
  }
  catch (error) {
    // console.error('Error executing query', error);
    throw error;
  }
}

module.exports = {
  getDataByColumnName,
  getAllDataByColumnName,
  getUserIdByUsername,
  deleteInputFromTable,
  getUniqueFromTable,
  getMultiFromTable,
  getUserTags,
  getAllTagNames,
  getMultiFromTableWithOrder,
  postPendingUser,
  postUser,
  postUuid,
  postPicturesPath,
  postTags,
  updateInputsInTable,
  createConversation,
  getConversationIdByUserIds,
  newMessageInConversation,
  addNotification,
  getConversationsSummariesByUserId,
  getUsernameByUserId,
  getConversationUsersByConversationId,
  deleteMultipleRows,
  getConversationContentById,
  getConversationContentById,
  getUserProfileData,
  // incrementProfileLikes,
  updateLikedProfiles,
  decrementProfileLikes,
  addMatch,
  removeMatch,
  addBlockedUser,
  removeBlockedUser,
  updateLastActive,
  checkMatch,
  getMatchingProfiles,
  getFullUser,
  updateLocation,
  postView,
  getViewedProfiles,
  getViewers,
  getLikers,
  getLikedProfiles,
  getLikedIds,
  postLike,
  deleteLike,
  getUserLocation,
  searchProfiles,
  getUsersAccordingToGenderAndSexualPref,
  getSuggestedUsers,
  updateFameRating,
  getTagsName,
  markNotificationAsRead
};
