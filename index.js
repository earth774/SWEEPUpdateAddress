const express = require('express')
const app = express()
const port = 3000
const axios = require('axios').default;
const mysql = require('mysql') 
const util = require('util');
var _ = require('lodash');

const connect = mysql.createPool({
  host: "localhost",
  socketPath: '/Applications/MAMP/tmp/mysql/mysql.sock',
  user: "root",
  password: "root",
  database: "sweepstakes_db",
  charset: 'utf8'
});

const query = util.promisify(connect.query).bind(connect);
let dateObj = new Date();

let date_now = (dateObj.toISOString());

app.get('/insert', async (req, res) => {
  const address = await axios({
    method: 'get',
    url: 'https://raw.githubusercontent.com/earthchie/jquery.Thailand.js/master/jquery.Thailand.js/database/raw_database/raw_database.json'
  }).catch(err => {
    console.error(err)
  })


  for (const index in address.data) {
    const { province, amphoe, district, zipcode, district_code, amphoe_code, province_code } = address.data[index];
    const province_query = await query(`SELECT * FROM province where name_th='${province}' and status_id=1`).catch(err => {
      console.error('province:'+err)
    });
    let province_id = 0;
    if ((province_query).length === 0) {
      let insert_province = await query(`INSERT INTO province(name_th, name_en, status_id, created_at, updated_at) VALUES ('${province}','-','1','${date_now}','${date_now})'`);
      province_id = insert_province.insertId;
    } else {
      province_id = province_query[0].id;
    }

    const amphur_query = await query(`SELECT * FROM amphur where name_th='${amphoe}' and province_id=${province_id} and status_id=1`).catch(err => {
      console.error('amphur:'+err)
    });
    let amphur_id = 0;
    if ((amphur_query).length === 0) {
      let insert_amphur = await query(`INSERT INTO amphur(province_id,name_th, name_en, status_id, created_at, updated_at) VALUES (${province_id},'${amphoe}','-','1','${date_now}','${date_now}')`);
      amphur_id = insert_amphur.insertId;
    } else {
      amphur_id = amphur_query[0].id;
    }

    const district_query = await query(`SELECT * FROM district where name_th='${district}' and amphur_id=${amphur_id} and status_id=1`).catch(err => {
      console.error('district:'+err)
    });
    if ((district_query).length === 0) {
      let insert_district = await query(`INSERT INTO district(amphur_id,name_th, name_en, zip_code, status_id, created_at, updated_at) VALUES (${amphur_id},'${district}','-','${zipcode}','1','${date_now}','${date_now}')`);
    } 

    console.log(`ข้อมูลตัวที่ ${index} จาก ${address.data.length}`);

  }
  res.json(address.data)

})

app.get('/delete', async (req, res) => {
  const address = await axios({
    method: 'get',
    url: 'https://raw.githubusercontent.com/earthchie/jquery.Thailand.js/master/jquery.Thailand.js/database/raw_database/raw_database.json'
  }).catch(err => {
    console.error(err)
  })

  const province_query = await query(`SELECT * FROM province where status_id=1`).catch(err => {
    console.error('province:'+err)
  });
  let index = 0;
  for (const province of province_query) {
    const province_filter = address.data.filter(data => data.province === province.name_th);


    const amphur_query = await query(`SELECT * FROM amphur where province_id=${province.id} and status_id=1`).catch(err => {
      console.error('amphur:'+err)
    });
    for (const amphur of amphur_query) {
      const amphur_filter = address.data.filter(data => data.amphoe === amphur.name_th && data.province === province.name_th);
      

      const district_query = await query(`SELECT * FROM district where amphur_id=${amphur.id} and status_id=1`).catch(err => {
        console.error('amphur:'+err)
      });
      for (const district of district_query) {
        const district_filter = address.data.filter(data => data.district === district.name_th && data.amphoe === amphur.name_th && data.province === province.name_th);
        if ((district_filter).length === 0) {
          console.log(district);
          await query(`DELETE FROM district WHERE id = ? and amphur_id=?`, [district.id,amphur.id]);
        }
        console.log(`ข้อมูลตัวที่ ${index++} จาก ${address.data.length}`);
      }

      if ((amphur_filter).length === 0) {
        console.log(amphur);
        await query(`DELETE FROM amphur WHERE id = ? and province_id=?`, [amphur.id,province.id]);
      }
    }

    if ((province_filter).length === 0) {
      console.log(province);
      await query(`DELETE FROM province WHERE id = ?`, [3, province.id]);
    }
  }
  
  res.json(address.data)

});


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})