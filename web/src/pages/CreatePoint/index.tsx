import React, {useEffect, useState, ChangeEvent, FormEvent} from 'react';
import { Link, useHistory} from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import {Map, TileLayer, Marker} from 'react-leaflet';
import api from '../../services/api';
import axios from 'axios';
import {LeafletMouseEvent} from 'leaflet';

import Dropzone from '../../components/Dropzone';
import './styles.css';
import logo from '../../assets/logo.svg';

const CreatePoint = () => {

    //criar estado array ou objeto tem informar tipo variavel sera armazenada
    interface Item{
        id: number;
        title: string;
        image_url: string;
    }

    interface IBGEUFRes{
        sigla: string;
    }
    
    interface IBGECityRes{
        nome: string;
    }

    const [items, setItems] = useState<Item[]>([]);
    const [formData, setFormData] = useState({
        name: '', 
        email: '', 
        whatsapp: '',
    });
    const [initialPostion, setInitialPostion] = useState<[number, number]>([0,0]);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [ufs, setUfs] = useState<string[]>([]);
    const [selectedUf, setSelectedUf] = useState<string>('0');
    const [citys, setCitys] = useState<string[]>([]);
    const [selectedCity, setSelectedCity] = useState<string>('0');
    const [selectedPostion, setSelectedPostion] = useState<[number, number]>([0,0]);
    const [selectedFile, setSelectedFile] = useState<File>();

    const history = useHistory();

    useEffect( () => {
        navigator.geolocation.getCurrentPosition(position =>
            {
                const {latitude, longitude} = position.coords;
                setInitialPostion([latitude, longitude])
            });        
    }, [] );
    
    useEffect( () => {
        api.get('items').then(res =>{
            setItems(res.data);
        })
    }, [] ); //função ser disparada , quando função disparada
    
    function handleSelectUf(event: ChangeEvent<HTMLSelectElement>){
        const uf = event.target.value;
        setSelectedUf(uf);
    }

    function handleSelectCity(event: ChangeEvent<HTMLSelectElement>){
        const city = event.target.value;
        setSelectedCity(city);
    }

    function handleMapClick(event: LeafletMouseEvent){
        setSelectedPostion([
         event.latlng.lat, 
         event.latlng.lng
        ]);
    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement>){
        const {name, value } = event.target;
        //colchetes servem informam variavel é nome propriedade
        setFormData({ ...formData, [name]: value });
    }

    function handleSelectItem(id:number){
        const alreadySelected = selectedItems.findIndex(item => item ===id);
        if (alreadySelected >=0){
            const filteredItems = selectedItems.filter(item => item !==id);
            setSelectedItems(filteredItems);
        }else{
            setSelectedItems ( [...selectedItems, id] );
        }
    }

    async function handleSubmit(event: FormEvent){
        event.preventDefault();

        const {name, email, whatsapp} = formData;
        const uf = selectedUf;
        const city = selectedCity;
        const [latitude, longitude] = selectedPostion;
        const items = selectedItems;

        const data = new FormData();

        data.append('name', name);
        data.append('email', email);
        data.append('whatsapp', whatsapp);
        data.append('uf', uf);
        data.append('city', city);
        data.append('latitude', String(latitude)) ;
        data.append('longitude', String(longitude));
        data.append('items', items.join(','));

        if(selectedFile){
            data.append('image', selectedFile)
        }

        // const data = {
        //     name, 
        //     email, 
        //     whatsapp, 
        //     uf, 
        //     city, 
        //     latitude, 
        //     longitude, 
        //     items
        // }
        
        await api.post('points', data);

        alert('Ponto de coleta criado');

        history.push('/');
    }

    useEffect( () => {
        axios
        .get<IBGEUFRes[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(res => {
          const ufInitials = res.data.map(uf => uf.sigla);
          setUfs(ufInitials);
        });
    }, []);

    useEffect( () => {
        axios.get<IBGECityRes[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`).then(res => {
          const cityNames = res.data.map(city => city.nome);
          setCitys(cityNames);
        });
    }, [selectedUf]);

    return (
        <div id = "page-create-point" >
           <header>
               <img src={logo} alt="Ecoleta"/>

               <Link to="/">
                <FiArrowLeft />
                Voltar para home
               </Link>
           </header>

           <form onSubmit={handleSubmit}>

               <h1>Cadastro do <br /> ponto de coleta</h1>

               <Dropzone onFileUploaded={setSelectedFile}/>

               <fieldset>
                   <legend>
                      <h2>Dados</h2> 
                   </legend>
                   <div className="field">
                       <label htmlFor="name">Nome da entidade</label>
                        <input 
                        type="text"
                        name="name"
                        id="name"
                        onChange={handleInputChange}
                        />
                   </div>

                   <div className="field-group">

                   <div className="field">
                       <label htmlFor="email">E-mail</label>
                        <input 
                        type="email"
                        name="email"
                        id="email"
                        onChange={handleInputChange}
                        />
                   </div>

                   <div className="field">
                       <label htmlFor="whatsapp">Whatsapp</label>
                        <input 
                        type="text"
                        name="whatsapp"
                        id="whatsapp"
                        onChange={handleInputChange}
                        />
                   </div>

                   </div>

                   

               </fieldset>

               <fieldset>
                   <legend>
                      <h2>Endereço</h2> 
                      <span>Selecione o endereço no mapa</span>
                   </legend>

                   <Map center={initialPostion} zoom={15} onClick= {handleMapClick}>
                   <TileLayer
                        attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={selectedPostion} />
                   </Map>

                   <div className="field-group">
                       <div className="field">
                           <label htmlFor="uf">Estado (UF)</label>
                           <select 
                           name="uf" 
                           id="uf" 
                           value={selectedUf} 
                           onChange={handleSelectUf}
                           >
                               <option value="0">Selecione uma UF</option>
                               {ufs.map( uf =>(
                                   <option key={uf} value={uf}>{uf}</option>
                               ))}
                           </select>
                       </div>
                       <div className="field">
                           <label htmlFor="city">Cidade</label>
                           <select 
                           name="city" 
                           id="city"
                           value={selectedCity}
                           onChange={handleSelectCity}
                           >
                               <option value="0">Selecione uma cidade</option>
                               {citys.map( city =>(
                                   <option key={city} value={city}>{city}</option>
                               ))}
                           </select>
                       </div>
                   </div>
               </fieldset>

               <fieldset>
                   <legend>
                      <h2>Itens de coleta</h2> 
                      <span>Selecione um ou mais itens abaixo</span>
                   </legend>

                   <ul className="items-grid">
                       {items.map(item => (
                            <li 
                            key={item.id} 
                            onClick={() => handleSelectItem(item.id)}
                            className={selectedItems.includes(item.id)? 'selected' : ''}
                            >
                            <img src={item.image_url} alt={item.title}/>
                             <span>{item.title}</span>
                        </li>
                       ))}
    
                   </ul>
               </fieldset>

               <button type="submit">Cadastrar ponto de coleta</button>
                   
            </form>
        </div>
    );
}

export default CreatePoint;