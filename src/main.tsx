import React,{useEffect,useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Search,MapPin,ArrowRight,Menu,X,Users,TrendingUp,Sprout,Instagram,Facebook,MessageCircle,ChevronLeft,Lock,Plus,Globe,Share2,LogOut,Upload,Check,Trash2,Shield,Image as ImageIcon} from 'lucide-react';
import type {User} from '@supabase/supabase-js';
import {db,configured,defaults,safeUrl,instagramUrl,whatsappUrl} from './lib';
import type {Business,Category,Role} from './lib';
import './style.css';

type Page='home'|'directory'|'detail'|'register'|'admin'|'about';
type FormValues={name:string;category:string;city:string;address:string;description:string;whatsapp:string;instagram:string;facebook:string;website:string;owner_name:string;private_support_request:string;image_url:string;featured:boolean;status:'pending'|'approved'|'rejected'};
const empty:FormValues={name:'',category:'',city:'',address:'',description:'',whatsapp:'',instagram:'',facebook:'',website:'',owner_name:'',private_support_request:'',image_url:'',featured:false,status:'pending'};
const icons=['🍴','👕','🌸','🎁','🏠','💻','📖','♡','💼','🌿','🌴','•••'];
const imageFallback='/sin-logo.svg';

const errorText = (e: unknown): string => {
  if (typeof e === 'string') return e;

  if (e && typeof e === 'object') {
    const err = e as {
      message?: string;
      code?: string;
      details?: string;
      hint?: string;
    };

    return [
      err.message,
      err.code ? `Código: ${err.code}` : null,
      err.details,
      err.hint
    ].filter(Boolean).join(' | ') || JSON.stringify(e);
  }

  return String(e);
};

function App(){
 const [page,setPage]=useState<Page>(()=>location.hash.startsWith('#/admin')?'admin':location.hash.startsWith('#/registro')?'register':'home');
 const [items,setItems]=useState<Business[]>([]);
 const [cats,setCats]=useState<string[]>(defaults);
 const [selected,setSelected]=useState<Business|null>(null);
 const [q,setQ]=useState('');
 const [cat,setCat]=useState('');
 const [city,setCity]=useState('');
 const [menu,setMenu]=useState(false);
 const [user,setUser]=useState<User|null>(null);
 const [role,setRole]=useState<Role>(null);
 const [adminItems,setAdminItems]=useState<Business[]>([]);
 const [tab,setTab]=useState<'pending'|'approved'|'rejected'|'new'|'categories'|'users'>('pending');
 const [editing,setEditing]=useState<string|null>(null);
 const [form,setForm]=useState<FormValues>(empty);
 const [newCat,setNewCat]=useState('');
 const [inviteEmail,setInviteEmail]=useState('');
 const [inviteRole,setInviteRole]=useState<'admin'|'superadmin'>('admin');
 const [loading,setLoading]=useState(false);
 const [notice,setNotice]=useState('');
 const [authEmail,setAuthEmail]=useState('');
 const [authPassword,setAuthPassword]=useState('');
 const [file,setFile]=useState<File|null>(null);
 const go=(p:Page)=>{setPage(p);setMenu(false);location.hash=p==='home'?'':`/${p}`;window.scrollTo({top:0,behavior:'smooth'});setNotice('')};
 const loadPublic=async()=>{if(!db)return;
 const [{data:bs,error:be},{data:cs,error:ce}]=await Promise.all([db.from('businesses').select('id,name,category,city,address,description,image_url,whatsapp,instagram,facebook,website,featured,status,created_at').eq('status','approved').order('featured',{ascending:false}).order('created_at',{ascending:false}),db.from('categories').select('id,name,sort_order').order('sort_order')]);if(be)setNotice(be.message);else setItems((bs||[]) as Business[]);if(!ce&&cs?.length)setCats((cs as Category[]).map(x=>x.name))};
 const loadAdmin=async()=>{if(!db||!user||!role)return;
 const {data,error}=await db.from('businesses').select('*').order('created_at',{ascending:false});if(error)setNotice(error.message);else setAdminItems((data||[]) as Business[])};
 useEffect(()=>{void loadPublic();if(!db)return;void db.auth.getUser().then(({data})=>setUser(data.user));
 const {data:{subscription}}=db.auth.onAuthStateChange((_event,session)=>setUser(session?.user||null));return()=>subscription.unsubscribe()},[]);
 useEffect(()=>{if(!db||!user){setRole(null);setAdminItems([]);return}void db.from('admin_users').select('role').eq('user_id',user.id).maybeSingle().then(({data,error})=>{setRole(error?null:(data?.role as Role)||null)})},[user]);
 useEffect(()=>{void loadAdmin()},[user,role]);
 const cities=useMemo(()=>[...new Set(items.map(b=>b.city).filter(Boolean))].sort(),[items]);
 const filtered=useMemo(()=>items.filter(b=>(!q||`${b.name} ${b.description||''}`.toLowerCase().includes(q.toLowerCase()))&&(!cat||b.category===cat)&&(!city||b.city===city)),[items,q,cat,city]);
 const detail=(b:Business)=>{setSelected(b);go('detail')};
 
 
 

const uploadImage = async (f: File, admin: boolean) => {
  if (!db) throw Error('Supabase no está configurado');

  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(f.type)) {
    throw Error('Selecciona una imagen JPG, PNG o WEBP');
  }

  if (f.size > 5 * 1024 * 1024) {
    throw Error('La imagen no puede superar 5 MB');
  }

  const ext = f.type === 'image/png'
    ? 'png'
    : f.type === 'image/webp' ? 'webp' : 'jpg';

  const bucket = admin ? 'business-logos' : 'business-submissions';
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await db.storage
    .from(bucket)
    .upload(path, f, {
      contentType: f.type,
      upsert: false
    });

  if (error) throw error;

  if (!admin) return path;

  return db.storage.from(bucket).getPublicUrl(path).data.publicUrl;
};



 const submit=async(e:React.FormEvent,admin=false)=>{e.preventDefault();
   
    if(!db){setNotice('Falta configurar Supabase. Consulta el README.');
        return}if(!form.name.trim()||!form.category||!form.whatsapp.trim()){setNotice('Completa nombre, categoría y WhatsApp.');return}setLoading(true);setNotice('');try{
            const image_url=file
            ?await uploadImage(file, admin)
            :form.image_url||null;
            const values={name:form.name.trim(),category:form.category,city:form.city.trim()||'Virtual',address:form.address.trim()||null,description:form.description.trim()||null,whatsapp:form.whatsapp.trim(),instagram:form.instagram.trim()||null,facebook:form.facebook.trim()||null,website:form.website.trim()||null,owner_name:form.owner_name.trim()||null,private_support_request:form.private_support_request.trim()||null,image_url,
            ...(admin ? { featured: form.featured, status: form.status } : {})};
            



            const res=admin&&editing?await db.from('businesses').update(values).eq('id',editing):await db.from('businesses').insert(values);if(res.error)throw res.error;setForm(empty);setFile(null);setEditing(null);setNotice(admin?'Cambios guardados correctamente.':'¡Solicitud enviada! Tu emprendimiento quedó pendiente de revisión.');await loadPublic();if(admin){await loadAdmin();setTab(form.status)}}catch(err){setNotice('No se pudo guardar: '+errorText(err))}finally{setLoading(false)}};
 
      
const setStatus = async (
  b: Business,
  status: Business['status']
) => {
  if (!db) return;

  setLoading(true);
  setNotice('');

  try {
    let image_url = b.image_url;

    if (
      status === 'approved' &&
      image_url &&
      !image_url.startsWith('http')
    ) {
      const { data: image, error: downloadError } =
        await db.storage
          .from('business-submissions')
          .download(image_url);

      if (downloadError) throw downloadError;

      const { error: uploadError } =
        await db.storage
          .from('business-logos')
          .upload(image_url, image, {
            contentType: image.type || 'image/jpeg',
            upsert: true
          });

      if (uploadError) throw uploadError;

      image_url = db.storage
        .from('business-logos')
        .getPublicUrl(image_url).data.publicUrl;
    }

    const { error } = await db
      .from('businesses')
      .update({ status, image_url })
      .eq('id', b.id);

    if (error) throw error;

    setNotice(
      `${b.name}: ${
        status === 'approved'
          ? 'aprobado'
          : status === 'rejected'
          ? 'rechazado'
          : 'pendiente'
      }`
    );

    await loadAdmin();
    await loadPublic();

  } catch (err) {
    setNotice('No se pudo actualizar: ' + errorText(err));
  } finally {
    setLoading(false);
  }
};



    const edit=(b:Business)=>{setForm({name:b.name||'',category:b.category||'',city:b.city||'',address:b.address||'',description:b.description||'',whatsapp:b.whatsapp||'',instagram:b.instagram||'',facebook:b.facebook||'',website:b.website||'',owner_name:b.owner_name||'',private_support_request:b.private_support_request||'',image_url:b.image_url||'',featured:b.featured,status:b.status});setEditing(b.id);setFile(null);setTab('new');setNotice('')};
 const login=async(e:React.FormEvent)=>{e.preventDefault();if(!db)return;setLoading(true);
    const {error}=await db.auth.signInWithPassword({email:authEmail,password:authPassword});setLoading(false);setNotice(error?error.message:'Sesión iniciada. Comprobando permisos...')};
 const addCategory=async()=>{if(!db||!newCat.trim())return;
    const {error}=await db.from('categories').insert({name:newCat.trim(),sort_order:cats.length});if(error)setNotice(error.message);else{setNewCat('');setNotice('Categoría creada');await loadPublic()}};
 const addAdmin=async()=>{if(!db||role!=='superadmin')return;
    const {error}=await db.rpc('grant_admin_by_email',{target_email:inviteEmail.trim(),target_role:inviteRole});setNotice(error?error.message:'Permisos actualizados. La persona debe tener una cuenta creada en Supabase Auth.');if(!error)setInviteEmail('')};
 const share=async(b:Business)=>{const url=`${location.origin}${location.pathname}#/negocio/${b.id}`;try{if(navigator.share)await navigator.share({title:b.name,url});else{await navigator.clipboard.writeText(url);setNotice('Enlace copiado')}}catch{}};
 useEffect(()=>{if(!items.length)return;
    const match=location.hash.match(/^#\/negocio\/([0-9a-f-]+)$/);if(match){const b=items.find(x=>x.id===match[1]);if(b){setSelected(b);setPage('detail')}}},[items]);
 const card=(b:Business)=><article className="business-card" key={b.id}><div className="card-image" role="button" tabIndex={0} onClick={()=>detail(b)} onKeyDown={e=>e.key==='Enter'&&detail(b)}><img src={safeUrl(b.image_url)||imageFallback} alt={b.name} loading="lazy" onError={e=>{e.currentTarget.src=imageFallback}}/></div><div className="card-info"><small>{b.category}</small><strong>{b.name}</strong><span><MapPin size={15}/>{b.city||'Virtual'}</span><button className="card-arrow" onClick={()=>detail(b)} aria-label={`Ver ${b.name}`}><ArrowRight size={21}/></button></div></article>;
 const field=(label:string,key:keyof FormValues,required=false,kind:'text'|'textarea'|'select'='text')=><label key={key}>{label}{required?' *':''}{kind==='textarea'?<textarea rows={3} value={String(form[key])} onChange={e=>setForm({...form,[key]:e.target.value})} required={required}/>:kind==='select'?<select value={String(form[key])} onChange={e=>setForm({...form,[key]:e.target.value})} required={required}><option value="">Selecciona una categoría</option>{cats.map(c=><option key={c} value={c}>{c}</option>)}</select>:<input value={String(form[key])} onChange={e=>setForm({...form,[key]:e.target.value})} required={required}/>}</label>;
 const businessForm=(admin=false)=><form className="ace-form" onSubmit={e=>void submit(e,admin)}><div className="form-grid">{field('Nombre del negocio','name',true)}{field('Categoría','category',true,'select')}{field('Nombre del dueño o responsable','owner_name')}{field('WhatsApp de contacto','whatsapp',true)}{field('Ciudad o municipio','city')}{field('Dirección (o indica si es virtual)','address')}{field('Instagram (usuario o enlace)','instagram')}{field('Facebook (enlace)','facebook')}{field('Sitio web (enlace)','website')}{field('Descripción de productos o servicios','description',false,'textarea')}{field('¿Cómo deseas que la Academia te ayude? (respuesta privada)','private_support_request',false,'textarea')}<label>Logotipo o fotografía (máximo 5 MB)<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setFile(e.target.files?.[0]||null)}/></label>{admin&&field('URL de imagen existente','image_url')}</div>{admin&&<div className="form-grid"><label>Estado<select value={form.status} onChange={e=>setForm({...form,status:e.target.value as Business['status']})}><option value="pending">Pendiente</option><option value="approved">Aprobado</option><option value="rejected">Rechazado</option></select></label><label className="check"><input type="checkbox" checked={form.featured} onChange={e=>setForm({...form,featured:e.target.checked})}/> Emprendimiento destacado</label></div>}{!admin&&<p className="privacy-note">La información de contacto del negocio podrá mostrarse públicamente si se aprueba. Tu respuesta sobre el apoyo de la Academia será privada. Al enviar aceptas que revisemos estos datos para el directorio.</p>}<button className="primary-btn" disabled={loading||!configured} type="submit"><Upload size={18}/>{loading?'Guardando...':admin?'Guardar emprendimiento':'Enviar emprendimiento para revisión'}</button></form>;
 return <><header className="site-header"><div className="header-inner"><button className="brand" onClick={()=>go('home')}><span className="brand-mark">▥</span><span className="brand-name">Academia para la<br/>Creación de Empresas</span><span className="chapter">Capítulo El Dorado</span></button><nav className={menu?'nav open':'nav'}><button className={page==='home'?'current':''} onClick={()=>go('home')}>Inicio</button><button className={page==='directory'?'current':''} onClick={()=>go('directory')}>Directorio</button><button className={page==='register'?'current':''} onClick={()=>go('register')}>Registra tu emprendimiento</button><button onClick={()=>go('about')}>Sobre la Academia</button><button className="admin-link" onClick={()=>go('admin')}>Administración</button></nav><button className="mobile-menu" aria-label="Abrir menú" onClick={()=>setMenu(!menu)}>{menu?<X/>:<Menu/>}</button></div></header>
 {!configured&&<div className="config-alert">Proyecto preparado: configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para activar los datos y formularios.</div>}
 {page==='home'&&<><section className="hero"><div className="hero-photo"/><div className="hero-curve"/><div className="hero-content"><p className="eyebrow">DIRECTORIO DE EMPRENDIMIENTOS</p><h1>Conectamos ideas,<br/><em>emprendimientos</em><br/>y oportunidades.</h1><p>Descubre los productos y servicios de los emprendedores del Capítulo El Dorado y apoya el talento de nuestra comunidad.</p></div><div className="search-panel"><label className="search-field"><Search/><input placeholder="¿Qué producto o servicio buscas?" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&go('directory')}/></label><select value={cat} onChange={e=>setCat(e.target.value)}><option value="">Todas las categorías</option>{cats.map(c=><option key={c}>{c}</option>)}</select><select value={city} onChange={e=>setCity(e.target.value)}><option value="">Todas las ciudades</option>{cities.map(c=><option key={c}>{c}</option>)}</select><button className="primary-btn" onClick={()=>go('directory')}><Search size={20}/> Buscar</button></div></section><section className="category-strip"><div className="category-row">{cats.map((c,i)=><button className="category-tile" key={c} onClick={()=>{setCat(c);go('directory')}}><span>{icons[i%icons.length]}</span><small>{c}</small></button>)}</div></section><section className="featured wrap"><div className="section-heading"><h2>Emprendimientos destacados</h2><span className="gold-line"/><button onClick={()=>go('directory')}>Ver todos <ArrowRight size={18}/></button></div><div className="card-grid">{items.filter(b=>b.featured).slice(0,4).map(card)}</div>{!items.some(b=>b.featured)&&<div className="empty">Pronto encontrarás aquí los emprendimientos destacados.</div>}<div className="register-cta"><div><h2>¿Tienes un emprendimiento?</h2><p>Comparte tu negocio con nuestra comunidad.</p></div><button className="primary-btn" onClick={()=>go('register')}>Registrar mi negocio <ArrowRight size={18}/></button>
 </div></section><section className="benefits"><div className="wrap benefits-inner"><blockquote>“Grandes oportunidades nacen cuando una comunidad apoya a sus emprendedores.”</blockquote><div><Users color="#E82D3B"/><strong>Conecta</strong><span>Encuentra productos y servicios locales.</span></div><div><TrendingUp color="#E6BB33"/><strong>Apoya</strong><span>Impulsa el talento de nuestra comunidad.</span></div><div><Sprout color="#E82D3B"/><strong>Crece juntos</strong><span>Más oportunidades para todos.</span></div></div></section></>}
 {page==='directory'&&<main className="wrap inner-page"><p className="eyebrow">EXPLORA NUESTRA COMUNIDAD</p><h1>Directorio de emprendimientos</h1><p>Descubre los negocios que ya han sido aprobados.</p><div className="filters"><label><Search size={20}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar emprendimientos..."/></label><select value={cat} onChange={e=>setCat(e.target.value)}><option value="">Todas las categorías</option>{cats.map(c=><option key={c}>{c}</option>)}</select><select value={city} onChange={e=>setCity(e.target.value)}><option value="">Todas las ciudades</option>{cities.map(c=><option key={c}>{c}</option>)}</select><button onClick={()=>{setQ('');setCat('');setCity('')}}>Limpiar filtros</button></div><p className="result-count">{filtered.length} emprendimiento(s)</p><div className="card-grid">{filtered.map(card)}</div>{filtered.length===0&&<div className="empty">No hay emprendimientos publicados con estos filtros.</div>}</main>}
 {page==='detail'&&selected&&<main className="wrap inner-page"><button className="back" onClick={()=>go('directory')}><ChevronLeft size={18}/> Volver al directorio</button><div className="detail-layout"><img className="detail-photo" src={safeUrl(selected.image_url)||imageFallback} alt={selected.name}/><div className="detail-text"><p className="eyebrow">{selected.category}</p><h1>{selected.name}</h1><p><MapPin size={17} className="inline-icon"/> {selected.city||'Virtual'}</p><p>{selected.description||'Conoce este emprendimiento de nuestra comunidad.'}</p><div className="detail-actions">{whatsappUrl(selected.whatsapp)&&<a className="primary-btn" target="_blank" rel="noopener noreferrer" href={whatsappUrl(selected.whatsapp)}><MessageCircle size={18}/> WhatsApp</a>}{instagramUrl(selected.instagram)&&<a href={instagramUrl(selected.instagram)} target="_blank" rel="noopener noreferrer"><Instagram/> Instagram</a>}{safeUrl(selected.facebook)&&<a href={safeUrl(selected.facebook)} target="_blank" rel="noopener noreferrer"><Facebook/> Facebook</a>}{safeUrl(selected.website)&&<a href={safeUrl(selected.website)} target="_blank" rel="noopener noreferrer"><Globe/> Sitio web</a>}<button onClick={()=>void share(selected)}><Share2 size={18}/> Compartir</button></div></div></div></main>}
 {page==='register'&&<main className="wrap inner-page"><p className="eyebrow">HAZ PARTE DE NUESTRA COMUNIDAD</p><h1>Registra tu emprendimiento</h1><p>Completa tus datos. Nuestro equipo revisará la información antes de publicar tu negocio.</p><div className="registration-panel">{businessForm(false)}</div></main>}
 {page==='about'&&<main className="wrap inner-page about"><p className="eyebrow">CAPÍTULO EL DORADO</p><h1>Emprender también es construir comunidad.</h1><p>Este directorio reúne los emprendimientos aprobados por la administración del Capítulo El Dorado de la Academia para la Creación de Empresas.</p><button className="primary-btn" onClick={()=>go('directory')}>Explorar directorio <ArrowRight size={18}/></button></main>}
 {page==='admin'&&<main className="wrap inner-page admin"><div className="admin-title"><div><p className="eyebrow">ÁREA PRIVADA · ACE EL DORADO</p><h1>Panel de administración</h1><p>Revisa y aprueba los negocios antes de publicarlos.</p></div><Lock color="#E82D3B" size={32}/></div>{!user?<div className="auth-panel"><h2>Iniciar sesión</h2><p>Acceso exclusivo para administradores autorizados.</p><form className="ace-form" onSubmit={e=>void login(e)}><label>Correo electrónico<input type="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} required/></label><label>Contraseña<input type="password" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} required/></label><button className="primary-btn" type="submit" disabled={loading||!configured}>Entrar</button></form></div>:!role?<div className="auth-panel"><h2>Sin permisos administrativos</h2><p>La cuenta {user.email} existe, pero no tiene permiso de administrador. Solicita acceso al superadministrador.</p><button onClick={()=>void db?.auth.signOut()}>Cerrar sesión</button></div>:<><div className="admin-toolbar"><span><Shield size={18}/> {user.email} · {role==='superadmin'?'Superadministrador':'Administrador'}</span><button onClick={()=>void db?.auth.signOut()}><LogOut size={16}/> Salir</button></div><div className="admin-stats"><div><strong>{adminItems.filter(b=>b.status==='pending').length}</strong><span>Pendientes</span></div><div><strong>{adminItems.filter(b=>b.status==='approved').length}</strong><span>Publicados</span></div><div><strong>{adminItems.filter(b=>b.status==='rejected').length}</strong><span>Rechazados</span></div></div><div className="admin-tabs"><button className={tab==='pending'?'selected':''} onClick={()=>setTab('pending')}>Pendientes</button><button className={tab==='approved'?'selected':''} onClick={()=>setTab('approved')}>Publicados</button><button className={tab==='rejected'?'selected':''} onClick={()=>setTab('rejected')}>Rechazados</button><button className={tab==='new'?'selected':''} onClick={()=>{setForm(empty);setEditing(null);setTab('new')}}><Plus size={16}/> Nuevo / editar</button><button className={tab==='categories'?'selected':''} onClick={()=>setTab('categories')}>Categorías</button>{role==='superadmin'&&<button className={tab==='users'?'selected':''} onClick={()=>setTab('users')}>Administradores</button>}</div>{['pending','approved','rejected'].includes(tab)&&<div className="admin-list">{adminItems.filter(b=>b.status===tab).map(b=><div className="admin-row admin-row-expanded" key={b.id}><img src={safeUrl(b.image_url)||imageFallback} alt=""/><div className="admin-row-main"><strong>{b.name}</strong><small>{b.category} · {b.city||'Virtual'}</small><small>Responsable: {b.owner_name||'Sin indicar'} · WhatsApp: {b.whatsapp||'Sin indicar'}</small><small>Dirección: {b.address||'Sin indicar'}</small>{b.private_support_request&&<p className="private-data"><Lock size={13}/> Solicitud privada: {b.private_support_request}</p>}</div><div className="admin-actions"><button onClick={()=>edit(b)}>Editar</button>{b.status!=='approved'&&<button className="approve" disabled={loading} onClick={()=>void setStatus(b,'approved')}><Check size={16}/> Aprobar</button>}{b.status!=='pending'&&<button disabled={loading} onClick={()=>void setStatus(b,'pending')}>Pendiente</button>}{b.status!=='rejected'&&<button className="reject" disabled={loading} onClick={()=>void setStatus(b,'rejected')}><X size={16}/> Rechazar</button>}</div></div>)}{!adminItems.some(b=>b.status===tab)&&<div className="empty">No hay negocios en esta sección.</div>}</div>}{tab==='new'&&<div className="registration-panel"><h2>{editing?'Editar negocio':'Crear negocio'}</h2>{businessForm(true)}</div>}{tab==='categories'&&<div className="registration-panel"><h2>Categorías disponibles</h2><div className="category-admin-list">{cats.map(c=><span key={c}>{c}</span>)}</div><label>Nueva categoría<input value={newCat} onChange={e=>setNewCat(e.target.value)} placeholder="Nombre de la categoría"/></label><button className="primary-btn" onClick={()=>void addCategory()}>Agregar categoría</button></div>}{tab==='users'&&role==='superadmin'&&<div className="registration-panel"><h2>Autorizar administradores</h2><p>La persona debe existir previamente en Supabase Authentication. Esta acción solo puede realizarla un superadministrador.</p><label>Correo del usuario<input type="email" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)}/></label><label>Rol<select value={inviteRole} onChange={e=>setInviteRole(e.target.value as 'admin'|'superadmin')}><option value="admin">Administrador</option><option value="superadmin">Superadministrador</option></select></label><button className="primary-btn" onClick={()=>void addAdmin()}>Conceder acceso</button></div>}</>}</main>}
 {notice&&<div className="notice" role="status"><span>{notice}</span><button onClick={()=>setNotice('')} aria-label="Cerrar aviso"><X size={16}/></button></div>}
 
 
 <footer>
 <div className="wrap footer-inner">
 <div>
 <strong>Academia para la Creación de Empresas</strong>
 <span>Capítulo El Dorado · Directorio de emprendimientos</span>
 </div><span>Conectando emprendimientos y comunidad</span>
 </div>
 </footer></>
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
