import { FileUpload } from "primereact/fileupload";

export default function (props){
  return <div>
    <div>
      <h1>Load Manager</h1>
    </div>
    <div>
      <FileUpload mode="basic" chooseLabel="Aç" onSelect={e=>{
        e.originalEvent.preventDefault()
        console.log(e.files[0].path)
        if(props.onSelect) {
          props.onSelect(e.files[0].path)
        }
      }}/>
    </div>
  </div>

}
